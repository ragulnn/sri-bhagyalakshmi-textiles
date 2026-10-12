
pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 20, unit: 'MINUTES')
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
                        -f compose.test.yaml up --build -d --wait

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
