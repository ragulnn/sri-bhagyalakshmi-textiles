pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 45, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    environment {
        BACKEND_IMAGE = 'sri-bhagyalakshmi-textiles-backend'
        FRONTEND_IMAGE = 'sri-bhagyalakshmi-textiles-frontend'
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
                    sh 'npm ci'
                    sh 'npm run typecheck'
                    sh 'npm test'
                }
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

        stage('Frontend CI') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'

                    withSonarQubeEnv('Local-SonarQube') {
                        sh """
                            set -eu
                            "${scannerHome}/bin/sonar-scanner" '-Dsonar.projectKey=sri-bhagyalakshmi-textiles' '-Dsonar.projectName=Sri Bhagyalakshmi Textiles' '-Dsonar.sources=backend,frontend/src' '-Dsonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**' '-Dsonar.sourceEncoding=UTF-8' '-Dsonar.qualitygate.wait=true'
                        """
                    }
                }
            }
        }

        stage('Security Scanning - npm audit') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                    sh 'npm audit --audit-level=high'
                }

                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm audit --audit-level=high'
                }
            }
        }

        stage('Gitleaks Secret Scanning') {
            steps {
                sh '''
                    set -eu
                    gitleaks detect \
                        --source . \
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
    }

    post {
        success {
            archiveArtifacts(
                artifacts: 'frontend/dist/**',
                fingerprint: true
            )

            echo 'CI passed: tests, code quality, dependency security, secret scanning, Docker builds, and Trivy image scans.'
        }

        failure {
            echo 'CI failed. Review the failed stage before publishing or deploying images.'
        }

        always {
            echo 'CI pipeline finished. Review the stage results above.'
        }
    }
}
