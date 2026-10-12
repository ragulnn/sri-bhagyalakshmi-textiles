
pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
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
    }

    post {
        success {
            archiveArtifacts(
                artifacts: 'frontend/dist/**',
                fingerprint: true
            )
        }

        always {
            echo 'CI pipeline finished. Review the stage results above.'
        }
    }
}
