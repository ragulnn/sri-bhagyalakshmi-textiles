
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

                            if grep -Eqi 'EAI_AGAIN|ENOTFOUND|ECONNRESET|ETIMEDOUT|ECONNREFUSED|audit endpoint returned an error|request to .* failed' "$audit_log" \\\n                                && [ "$attempt" -lt "$max_attempts" ]; then
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
            '''
        }

        failure {
            echo '''
                CI failed. Review the failed stage and fix the underlying
                issue before publishing or deploying images.
            '''
        }

        always {
            echo 'CI pipeline finished. Review the stage results above.'
        }
    }
}
