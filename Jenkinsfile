
pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 45, unit: 'MINUTES')
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
    }

    environment {
        BACKEND_IMAGE = 'sri-bhagyalakshmi-textiles-backend'
        FRONTEND_IMAGE = 'sri-bhagyalakshmi-textiles-frontend'
        DOCKERHUB_REPO = 'ragdocker812/sri-bhagyalakshmi-textiles'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend CI') {
            steps {
                dir('backend') {
                    sh '''
                        set -eu
                        npm ci
                        npm run typecheck
                        npm test
                    '''
                }
            }
        }

        stage('Backend Coverage') {
            steps {
                dir('backend') {
                    sh '''
                        set -eu

                        npx c8 \
                            --reporter=text \
                            --reporter=lcov \
                            --reports-dir=coverage \
                            node --import tsx --test tests/*.test.ts

                        test -s coverage/lcov.info
                    '''
                }

                archiveArtifacts(
                    artifacts: 'backend/coverage/lcov.info',
                    fingerprint: true
                )
            }
        }

        stage('API Integration Tests') {
            steps {
                sh '''
                    set -eu

                    docker compose -p sbt-ci-test \
                        -f compose.test.yaml up \
                        --build -d --wait

                    npm --prefix backend run test:integration
                '''
            }

            post {
                always {
                    sh '''
                        docker compose -p sbt-ci-test \
                            -f compose.test.yaml down \
                            --volumes --remove-orphans
                    '''
                }
            }
        }

        stage('Frontend CI & Coverage') {
            steps {
                dir('frontend') {
                    sh '''
                        set -eu

                        npm ci
                        npm run build
                        npm run test:coverage

                        test -s coverage/lcov.info
                    '''
                }

                archiveArtifacts(
                    artifacts: 'frontend/coverage/lcov.info',
                    fingerprint: true
                )
            }
        }

        stage('Verify Coverage Reports') {
            steps {
                sh '''
                    set -eu

                    echo "Checking backend coverage..."
                    test -s backend/coverage/lcov.info

                    echo "Checking frontend coverage..."
                    test -s frontend/coverage/lcov.info

                    echo "Both LCOV reports are available."
                    wc -l \
                        backend/coverage/lcov.info \
                        frontend/coverage/lcov.info
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'

                    withSonarQubeEnv('Local-SonarQube') {
                        sh """
                            set -eu

                            "${scannerHome}/bin/sonar-scanner" \
                                '-Dsonar.projectKey=sri-bhagyalakshmi-textiles' \
                                '-Dsonar.projectName=Sri Bhagyalakshmi Textiles' \
                                '-Dsonar.sources=backend,frontend/src' \
                                '-Dsonar.tests=backend/tests,frontend/src' \
                                '-Dsonar.test.inclusions=backend/tests/**/*.test.ts,backend/tests/**/*.test.mjs,frontend/src/**/*.test.ts,frontend/src/**/*.test.tsx' \
                                '-Dsonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**,backend/tests/**,**/*.test.ts,**/*.test.tsx,**/*.test.mjs' \
                                '-Dsonar.sourceEncoding=UTF-8' \
                                '-Dsonar.javascript.lcov.reportPaths=backend/coverage/lcov.info,frontend/coverage/lcov.info' \
                                '-Dsonar.qualitygate.wait=true'
                        """
                    }
                }
            }
        }

        stage('Security Scanning - npm audit') {
            steps {
                // Retry temporary registry/DNS failures without hiding real vulnerabilities.
                dir('backend') {
                    sh '''
                        set -eu
                        attempt=1
                        max_attempts=3

                        while [ "$attempt" -le "$max_attempts" ]; do
                            audit_log="$(mktemp)"
                            set +e
                            npm audit --audit-level=high \\
                                --fetch-retries=3 \\
                                --fetch-retry-mintimeout=10000 \\
                                --fetch-retry-maxtimeout=60000 >"$audit_log" 2>&1
                            audit_status=$?
                            cat "$audit_log"
                            set -e

                            if [ "$audit_status" -eq 0 ]; then
                                rm -f "$audit_log"
                                exit 0
                            fi

                            if grep -Eqi 'EAI_AGAIN|ENOTFOUND|ECONNRESET|ETIMEDOUT|ECONNREFUSED|audit endpoint returned an error|request to .* failed' "$audit_log" \
                                && [ "$attempt" -lt "$max_attempts" ]; then
                                echo "Temporary npm registry/network failure (attempt $attempt/$max_attempts); retrying in 10 seconds..."
                                rm -f "$audit_log"
                                sleep 10
                                attempt=$((attempt + 1))
                            else
                                rm -f "$audit_log"
                                exit "$audit_status"
                            fi
                        done
                    '''
                }

                dir('frontend') {
                    sh '''
                        set -eu
                        attempt=1
                        max_attempts=3

                        while [ "$attempt" -le "$max_attempts" ]; do
                            audit_log="$(mktemp)"
                            set +e
                            npm audit --audit-level=high \\
                                --fetch-retries=3 \\
                                --fetch-retry-mintimeout=10000 \\
                                --fetch-retry-maxtimeout=60000 >"$audit_log" 2>&1
                            audit_status=$?
                            cat "$audit_log"
                            set -e

                            if [ "$audit_status" -eq 0 ]; then
                                rm -f "$audit_log"
                                exit 0
                            fi

                            if grep -Eqi 'EAI_AGAIN|ENOTFOUND|ECONNRESET|ETIMEDOUT|ECONNREFUSED|audit endpoint returned an error|request to .* failed' "$audit_log" \
                                && [ "$attempt" -lt "$max_attempts" ]; then
                                echo "Temporary npm registry/network failure (attempt $attempt/$max_attempts); retrying in 10 seconds..."
                                rm -f "$audit_log"
                                sleep 10
                                attempt=$((attempt + 1))
                            else
                                rm -f "$audit_log"
                                exit "$audit_status"
                            fi
                        done
                    '''
                }
            }
        }

        stage('Gitleaks Secret Scanning') {
            steps {
                sh '''
                    set -eu

                    gitleaks detect \
                        --source . \
                        --config .gitleaks.toml \
                        --redact \
                        --exit-code 1
                '''
            }
        }

        stage('Build Production Docker Images') {
            steps {
                sh '''
                    set -eu

                    docker build \
                        -t "${BACKEND_IMAGE}:${BUILD_NUMBER}" \
                        -t "${BACKEND_IMAGE}:latest" \
                        ./backend

                    docker build \
                        -t "${FRONTEND_IMAGE}:${BUILD_NUMBER}" \
                        -t "${FRONTEND_IMAGE}:latest" \
                        ./frontend
                '''
            }
        }

        stage('Trivy Image Vulnerability Scan') {
            steps {
                sh '''
                    set -eu

                    trivy image \
                        --severity HIGH,CRITICAL \
                        --exit-code 1 \
                        "${BACKEND_IMAGE}:${BUILD_NUMBER}"

                    trivy image \
                        --severity HIGH,CRITICAL \
                        --exit-code 1 \
                        "${FRONTEND_IMAGE}:${BUILD_NUMBER}"
                '''
            }
        }

        stage('Push Images to Private Docker Hub') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKERHUB_USER',
                        passwordVariable: 'DOCKERHUB_TOKEN'
                    )
                ]) {
                    sh '''
                        set -eu

                        echo "$DOCKERHUB_TOKEN" | docker login \
                            --username "$DOCKERHUB_USER" \
                            --password-stdin

                        trap 'docker logout >/dev/null 2>&1 || true' EXIT

                        docker tag \
                            "${BACKEND_IMAGE}:${BUILD_NUMBER}" \
                            "${DOCKERHUB_REPO}:backend-${BUILD_NUMBER}"

                        docker tag \
                            "${FRONTEND_IMAGE}:${BUILD_NUMBER}" \
                            "${DOCKERHUB_REPO}:frontend-${BUILD_NUMBER}"

                        docker push "${DOCKERHUB_REPO}:backend-${BUILD_NUMBER}"
                        docker push "${DOCKERHUB_REPO}:frontend-${BUILD_NUMBER}"
                    '''
                }
            }
        }

        stage('Deploy to Azure Container Apps') {
            when {
                expression { !env.BRANCH_NAME || env.BRANCH_NAME == 'main' }
            }
            steps {
                script {
                    def backendImage = "docker.io/${env.DOCKERHUB_REPO}:backend-${env.BUILD_NUMBER}"
                    def frontendImage = "docker.io/${env.DOCKERHUB_REPO}:frontend-${env.BUILD_NUMBER}"
                    def frontendUrl = 'https://sbt-frontend.niceriver-151594b0.centralindia.azurecontainerapps.io'

                    // Reuse the existing Jenkins username/password credential.
                    withCredentials([
                        usernamePassword(
                            credentialsId: 'azure-acr',
                            usernameVariable: 'AZURE_CLIENT_ID',
                            passwordVariable: 'AZURE_CLIENT_SECRET'
                        )
                    ]) {
                        sh(label: 'Authenticate to Azure', script: '''#!/usr/bin/env bash
set -euo pipefail
az login --service-principal \
  --username "$AZURE_CLIENT_ID" \
  --password "$AZURE_CLIENT_SECRET" \
  --tenant 'b39b5cae-d7a4-4c51-a131-f33d7b6fa7f9' \
  --output none

# Display the selected subscription and tenant without printing credentials.
az account show --query '{subscription:id, tenant:tenantId}' --output table
''')

                        // Deploy backend first. This stage never updates sbt-database.
                        sh(label: 'Deploy backend image', script: """#!/usr/bin/env bash
set -euo pipefail
az containerapp update \\
  --name sbt-backend \\
  --resource-group rg-sbt-production \\
  --image '${backendImage}' \\
  --output none
""")

                        timeout(time: 8, unit: 'MINUTES') {
                            waitUntil(initialRecurrencePeriod: 10000, quiet: true) {
                                def state = sh(
                                    script: "az containerapp show --name sbt-backend --resource-group rg-sbt-production --query properties.provisioningState --output tsv",
                                    returnStdout: true
                                ).trim()
                                echo "Backend provisioning state: ${state}"
                                if (state == 'Failed') {
                                    error('Azure reports that the backend deployment failed.')
                                }
                                return state == 'Succeeded'
                            }
                        }

                        // Deploy frontend only after the backend update succeeds.
                        sh(label: 'Deploy frontend image', script: """#!/usr/bin/env bash
set -euo pipefail
az containerapp update \\
  --name sbt-frontend \\
  --resource-group rg-sbt-production \\
  --image '${frontendImage}' \\
  --output none
""")

                        timeout(time: 8, unit: 'MINUTES') {
                            waitUntil(initialRecurrencePeriod: 10000, quiet: true) {
                                def state = sh(
                                    script: "az containerapp show --name sbt-frontend --resource-group rg-sbt-production --query properties.provisioningState --output tsv",
                                    returnStdout: true
                                ).trim()
                                echo "Frontend provisioning state: ${state}"
                                if (state == 'Failed') {
                                    error('Azure reports that the frontend deployment failed.')
                                }
                                return state == 'Succeeded'
                            }
                        }

                        retry(6) {
                            sleep(time: 10, unit: 'SECONDS')
                            withEnv(["FRONTEND_URL=${frontendUrl}"]) {
                                sh(label: 'Frontend HTTP smoke test', script: '''#!/usr/bin/env bash
set -euo pipefail
code="$(curl --silent --show-error --location --output /dev/null --write-out '%{http_code}' "$FRONTEND_URL")"
echo "Frontend HTTP status: $code"
[[ "$code" =~ ^(200|301|302)$ ]]
''')
                            }
                        }

                        sh(label: 'Verify deployed image references', script: '''#!/usr/bin/env bash
set -euo pipefail
echo 'Backend image:'
az containerapp show --name sbt-backend --resource-group rg-sbt-production \
  --query "properties.template.containers[0].image" --output tsv
echo 'Frontend image:'
az containerapp show --name sbt-frontend --resource-group rg-sbt-production \
  --query "properties.template.containers[0].image" --output tsv
''')
                    }
                }
            }
        }
    }

    post {
        success {
            archiveArtifacts(
                artifacts: 'frontend/dist/**',
                fingerprint: true
            )

            echo '''
                CI passed:
                - Backend type checking and tests
                - Backend coverage
                - API integration tests
                - Frontend build, tests, and coverage
                - SonarQube quality gate
                - Dependency security scanning
                - Secret scanning
                - Docker image builds and vulnerability scans
                - Docker Hub image publishing
                - Azure Container Apps deployment (main branch only)
                - PostgreSQL Container App intentionally excluded from CD
            '''
        }

        failure {
            echo '''
                CI failed. Review the failed stage and fix the underlying
                issue before publishing or deploying images.
            '''
        }

        always {
            sh 'az logout >/dev/null 2>&1 || true'
            echo 'Pipeline finished. Review the stage results above.'
        }
    }
}
