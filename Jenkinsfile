
pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
    }

    environment {
        ARTIFACT_REPO = 'https://github.com/ragulnn/sbt-ci-artifacts.git'
        REPORT_DIR = 'reports'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm

                sh '''
                    mkdir -p reports/sonarqube
                    mkdir -p reports/metadata
                    echo "Jenkins report publishing test started." \
                        > reports/metadata/test-run.txt
                '''
            }
        }

        stage('SonarQube Analysis - Intentional Failure Test') {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'
                    int scanStatus

                    withSonarQubeEnv('Local-SonarQube') {
                        scanStatus = sh(
                            returnStatus: true,
                            script: """
                                set +e
                                "${scannerHome}/bin/sonar-scanner" \
                                    '-Dsonar.projectKey=sri-bhagyalakshmi-textiles' \
                                    '-Dsonar.projectName=Sri Bhagyalakshmi Textiles' \
                                    '-Dsonar.sources=backend,frontend/src' \
                                    '-Dsonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**' \
                                    '-Dsonar.sourceEncoding=UTF-8' \
                                    '-Dsonar.qualitygate.wait=true' \
                                    > reports/sonarqube/scanner.log 2>&1
                                result=\\$?
                                cat reports/sonarqube/scanner.log
                                exit \\$result
                            """
                        )
                    }

                    writeFile(
                        file: 'reports/sonarqube/scanner-exit-code.txt',
                        text: "${scanStatus}\\n"
                    )

                    if (fileExists('.scannerwork/report-task.txt')) {
                        sh '''
                            cp .scannerwork/report-task.txt \
                                reports/sonarqube/report-task.txt
                        '''
                    }

                    if (scanStatus != 0) {
                        error(
                            "SonarQube failed with exit code ${scanStatus}. " +
                            "Testing report publishing after a real scan failure."
                        )
                    }

                    // TEST ONLY: deliberately fail after successful analysis.
                    error(
                        'INTENTIONAL TEST FAILURE: verifying report publishing ' +
                        'after the SonarQube stage fails.'
                    )
                }
            }
        }
    }

    post {
        always {
            script {
                echo 'Collecting reports before the Jenkins agent is released.'

                sh '''
                    mkdir -p reports/metadata

                    cat > reports/metadata/build-info.txt <<EOF
JOB_NAME=${JOB_NAME}
BUILD_NUMBER=${BUILD_NUMBER}
BUILD_URL=${BUILD_URL}
GIT_COMMIT=${GIT_COMMIT:-unknown}
BUILD_RESULT=${currentBuildResult:-not-finalized}
EOF
                '''

                // Preserve reports in Jenkins first.
                archiveArtifacts(
                    artifacts: 'reports/**',
                    allowEmptyArchive: true,
                    fingerprint: true
                )

                // Then attempt the GitHub push, even after stage failure.
                try {
                    withCredentials([
                        usernamePassword(
                            credentialsId: 'github-pat',
                            usernameVariable: 'GITHUB_USER',
                            passwordVariable: 'GITHUB_TOKEN'
                        )
                    ]) {
                        sh '''
                            set -eu

                            export GIT_TERMINAL_PROMPT=0

                            ASKPASS="$WORKSPACE/.git-askpass-ci"
                            REPO_DIR="$WORKSPACE/.ci-artifact-repo"

                            trap 'rm -f "$ASKPASS"' EXIT

                            cat > "$ASKPASS" <<'ASKPASS_EOF'
#!/bin/sh
case "$1" in
    *Username*) printf '%s\\n' "$GITHUB_USER" ;;
    *Password*) printf '%s\\n' "$GITHUB_TOKEN" ;;
    *) exit 1 ;;
esac
ASKPASS_EOF

                            chmod 700 "$ASKPASS"
                            export GIT_ASKPASS="$ASKPASS"

                            rm -rf "$REPO_DIR"
                            git clone "$ARTIFACT_REPO" "$REPO_DIR"

                            cd "$REPO_DIR"

                            # Preserve reports under a unique build directory.
                            DEST="builds/${BUILD_NUMBER}"
                            mkdir -p "$DEST"
                            cp -R "$WORKSPACE/reports/." "$DEST/"

                            git config user.name "Jenkins CI"
                            git config user.email \
                                "jenkins-ci@users.noreply.github.com"

                            git add "$DEST"

                            if git diff --cached --quiet; then
                                echo "No new report files to commit."
                                exit 0
                            fi

                            git commit -m \
                                "CI reports for build ${BUILD_NUMBER}"

                            git push origin HEAD:main

                            echo "REPORT_PUSH_SUCCESS"
                        '''
                    }

                    echo 'GitHub report publication completed.'
                } catch (Exception ex) {
                    echo "REPORT_PUSH_FAILED: ${ex}"
                    currentBuild.description =
                        'Report publication failed; check console log'
                }
            }
        }

        success {
            echo 'Unexpected success: the intentional failure was not triggered.'
        }

        failure {
            echo 'Expected test result: pipeline failed at the SonarQube stage.'
        }
    }
}
