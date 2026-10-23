
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
        ARTIFACT_REPO = 'https://github.com/ragulnn/sbt-ci-artifacts.git'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm

                sh '''
                    set -eu
                    mkdir -p reports/test-results
                    mkdir -p reports/coverage
                    mkdir -p reports/security
                    mkdir -p reports/trivy
                    mkdir -p reports/sonarqube
                    mkdir -p reports/metadata
                '''
            }
        }

        stage('Backend CI') {
            steps {
                dir('backend') {
                    sh '''
                        set -eu

                        npm ci > ../reports/test-results/backend-install.log 2>&1
                        npm run typecheck > ../reports/test-results/backend-typecheck.log 2>&1
                        npm test > ../reports/test-results/backend-test.log 2>&1
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
                            node --import tsx --test tests/*.test.ts \
                            > ../reports/test-results/backend-coverage.log 2>&1

                        test -s coverage/lcov.info

                        mkdir -p ../reports/coverage/backend
                        cp -R coverage/. ../reports/coverage/backend/
                    '''
                }
            }
        }

        stage('API Integration Tests') {
            steps {
                script {
                    try {
                        sh '''
                            set -eu

                            docker compose \
                                -p sbt-ci-test \
                                -f compose.test.yaml \
                                up --build -d --wait \
                                > reports/test-results/api-compose-up.log 2>&1
                        '''

                        dir('backend') {
                            sh '''
                                set -eu

                                npm run test:integration \
                                    > ../reports/test-results/api-integration.log 2>&1
                            '''
                        }
                    } finally {
                        sh '''
                            docker compose \
                                -p sbt-ci-test \
                                -f compose.test.yaml \
                                logs --no-color \
                                > reports/test-results/api-compose-logs.log 2>&1 || true

                            docker compose \
                                -p sbt-ci-test \
                                -f compose.test.yaml \
                                down -v --remove-orphans || true
                        '''
                    }
                }
            }
        }

        stage('Frontend CI & Coverage') {
            steps {
                dir('frontend') {
                    sh '''
                        set -eu

                        npm ci > ../reports/test-results/frontend-install.log 2>&1
                        npm run build > ../reports/test-results/frontend-build.log 2>&1
                        npm run test:coverage > ../reports/test-results/frontend-coverage.log 2>&1

                        test -s coverage/lcov.info

                        mkdir -p ../reports/coverage/frontend
                        cp -R coverage/. ../reports/coverage/frontend/
                    '''
                }
            }
        }

        stage('Verify Coverage Reports') {
            steps {
                sh '''
                    set -eu

                    test -s reports/coverage/backend/lcov.info
                    test -s reports/coverage/frontend/lcov.info

                    echo "Backend and frontend coverage reports are available."
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'

                    withSonarQubeEnv('Local-SonarQube') {
                        withEnv(["SONAR_SCANNER_PATH=${scannerHome}"]) {
                            sh '''
                                set +e

                                "$SONAR_SCANNER_PATH/bin/sonar-scanner" \
                                    -Dsonar.projectKey=sri-bhagyalakshmi-textiles \
                                    -Dsonar.projectName="Sri Bhagyalakshmi Textiles" \
                                    -Dsonar.sources=backend,frontend/src \
                                    -Dsonar.tests=backend/tests \
                                    -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/** \
                                    -Dsonar.javascript.lcov.reportPaths=reports/coverage/backend/lcov.info,reports/coverage/frontend/lcov.info \
                                    -Dsonar.qualitygate.wait=true \
                                    > reports/sonarqube/scanner.log 2>&1

                                result=$?
                                echo "$result" > reports/sonarqube/scanner-exit-code.txt
                                cat reports/sonarqube/scanner.log
                                exit "$result"
                            '''
                        }
                    }

                    sh '''
                        if [ -f .scannerwork/report-task.txt ]; then
                            cp .scannerwork/report-task.txt \
                                reports/sonarqube/report-task.txt
                        fi
                    '''
                }
            }
        }

        stage('Dependency Audit') {
            steps {
                dir('backend') {
                    sh '''
                        set -eu

                        set +e
                        npm audit --json \
                            > ../reports/security/backend-npm-audit.json 2>&1
                        result=$?
                        set -e

                        echo "$result" > ../reports/security/backend-audit-exit-code.txt

                        python3 - <<'PY'
import json
from pathlib import Path

path = Path("../reports/security/backend-npm-audit.json")
try:
    data = json.loads(path.read_text())
except Exception as exc:
    print(f"Could not parse backend audit report: {exc}")
    raise SystemExit(1)

v = data.get("metadata", {}).get("vulnerabilities", {})
print("Backend audit:", v)

if v.get("high", 0) or v.get("critical", 0):
    raise SystemExit(1)
PY
                    '''
                }

                dir('frontend') {
                    sh '''
                        set -eu

                        set +e
                        npm audit --json \
                            > ../reports/security/frontend-npm-audit.json 2>&1
                        result=$?
                        set -e

                        echo "$result" > ../reports/security/frontend-audit-exit-code.txt

                        python3 - <<'PY'
import json
from pathlib import Path

path = Path("../reports/security/frontend-npm-audit.json")
try:
    data = json.loads(path.read_text())
except Exception as exc:
    print(f"Could not parse frontend audit report: {exc}")
    raise SystemExit(1)

v = data.get("metadata", {}).get("vulnerabilities", {})
print("Frontend audit:", v)

if v.get("high", 0) or v.get("critical", 0):
    raise SystemExit(1)
PY
                    '''
                }
            }
        }

        stage('Gitleaks Secret Scanning') {
            steps {
                sh '''
                    set +e

                    gitleaks detect \
                        --source . \
                        --report-format json \
                        --report-path reports/security/gitleaks.json \
                        --redact \
                        --no-banner \
                        > reports/security/gitleaks.log 2>&1

                    result=$?
                    echo "$result" > reports/security/gitleaks-exit-code.txt
                    cat reports/security/gitleaks.log
                    exit "$result"
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    set -eu

                    docker build \
                        -t "$BACKEND_IMAGE:$BUILD_NUMBER" \
                        ./backend

                    docker build \
                        -t "$FRONTEND_IMAGE:$BUILD_NUMBER" \
                        ./frontend

                    docker image inspect "$BACKEND_IMAGE:$BUILD_NUMBER" \
                        > reports/metadata/backend-image-inspect.json

                    docker image inspect "$FRONTEND_IMAGE:$BUILD_NUMBER" \
                        > reports/metadata/frontend-image-inspect.json
                '''
            }
        }

        stage('Trivy Image Vulnerability Scan') {
            steps {
                sh '''
                    set +e

                    trivy image \
                        --format json \
                        --output reports/trivy/backend.json \
                        --severity HIGH,CRITICAL \
                        --exit-code 0 \
                        "$BACKEND_IMAGE:$BUILD_NUMBER" \
                        > reports/trivy/backend.log 2>&1
                    backend_status=$?

                    trivy image \
                        --format json \
                        --output reports/trivy/frontend.json \
                        --severity HIGH,CRITICAL \
                        --exit-code 0 \
                        "$FRONTEND_IMAGE:$BUILD_NUMBER" \
                        > reports/trivy/frontend.log 2>&1
                    frontend_status=$?

                    printf 'backend_scan=%s\\nfrontend_scan=%s\\n' \
                        "$backend_status" "$frontend_status" \
                        > reports/trivy/scan-status.txt

                    if [ "$backend_status" -ne 0 ] ||
                       [ "$frontend_status" -ne 0 ]; then
                        exit 1
                    fi

                    python3 - <<'PY'
import json
from pathlib import Path

failed = False

for path in (
    Path("reports/trivy/backend.json"),
    Path("reports/trivy/frontend.json"),
):
    try:
        data = json.loads(path.read_text())
        for result in data.get("Results") or []:
            for vuln in result.get("Vulnerabilities") or []:
                severity = vuln.get("Severity", "").upper()
                if severity in ("HIGH", "CRITICAL"):
                    failed = True
                    print(
                        f"{path}: {severity} "
                        f"{vuln.get('VulnerabilityID', 'unknown')}"
                    )
    except Exception as exc:
        print(f"Invalid Trivy report {path}: {exc}")
        failed = True

Path("reports/trivy/quality-gate.txt").write_text(
    "FAIL: high/critical vulnerabilities found or scan invalid\\n"
    if failed else "PASS: no high/critical vulnerabilities found\\n"
)

raise SystemExit(1 if failed else 0)
PY
                '''
            }
        }

        stage('Push Images to Docker Hub') {
            when {
                expression {
                    currentBuild.currentResult == 'SUCCESS'
                }
            }

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

                        docker tag "$BACKEND_IMAGE:$BUILD_NUMBER" \
                            "$DOCKERHUB_REPO:backend-$BUILD_NUMBER"

                        docker tag "$FRONTEND_IMAGE:$BUILD_NUMBER" \
                            "$DOCKERHUB_REPO:frontend-$BUILD_NUMBER"

                        docker push "$DOCKERHUB_REPO:backend-$BUILD_NUMBER"
                        docker push "$DOCKERHUB_REPO:frontend-$BUILD_NUMBER"
                    '''
                }
            }
        }
    }

    post {
        always {
            script {
                sh '''
                    mkdir -p reports/metadata

                    printf 'BUILD_NUMBER=%s\\n' "$BUILD_NUMBER" \
                        > reports/metadata/build-info.txt
                    printf 'JOB_NAME=%s\\n' "$JOB_NAME" \
                        >> reports/metadata/build-info.txt
                    printf 'BUILD_URL=%s\\n' "$BUILD_URL" \
                        >> reports/metadata/build-info.txt
                '''

                writeFile(
                    file: 'reports/metadata/build-result.txt',
                    text: "Jenkins result: ${currentBuild.currentResult}\n"
                )

                try {
                    archiveArtifacts(
                        artifacts: 'reports/**/*',
                        allowEmptyArchive: true,
                        fingerprint: true
                    )
                } catch (Exception err) {
                    echo "REPORT_ARCHIVE_FAILED: ${err.message}"
                }

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
                            export GIT_ASKPASS="$WORKSPACE/.git-askpass.sh"

                            cat > "$GIT_ASKPASS" <<'ASKPASS'
#!/bin/sh
case "$1" in
    *Username*) printf '%s\\n' "$GITHUB_USER" ;;
    *Password*) printf '%s\\n' "$GITHUB_TOKEN" ;;
    *) exit 1 ;;
esac
ASKPASS

                            chmod 700 "$GIT_ASKPASS"

                            repo_dir="$WORKSPACE/.ci-artifact-repo"
                            rm -rf "$repo_dir"

                            git clone "$ARTIFACT_REPO" "$repo_dir"

                            destination="$repo_dir/builds/$BUILD_NUMBER"
                            mkdir -p "$destination"
                            cp -R reports/. "$destination/"

                            cd "$repo_dir"

                            git config user.name "Jenkins CI"
                            git config user.email "jenkins-ci@users.noreply.github.com"

                            git add "builds/$BUILD_NUMBER"

                            if git diff --cached --quiet; then
                                echo "No report changes to commit."
                            else
                                git commit -m "Add CI reports for build $BUILD_NUMBER"
                                git push origin HEAD:main
                            fi

                            echo "REPORT_PUSH_SUCCESS"
                        '''
                    }
                } catch (Exception err) {
                    echo "REPORT_PUSH_FAILED: ${err.message}"
                } finally {
                    sh '''
                        rm -f "$WORKSPACE/.git-askpass.sh" || true
                        rm -rf "$WORKSPACE/.ci-artifact-repo" || true
                    '''
                }

                echo "Final Jenkins result: ${currentBuild.currentResult}"
            }
        }

        success {
            archiveArtifacts(
                artifacts: 'frontend/dist/**/*',
                allowEmptyArchive: true,
                fingerprint: true
            )
            echo 'All required CI checks passed and Docker images were published.'
        }

        failure {
            echo 'CI failed. Later stages were skipped. Available reports were archived and GitHub publishing was attempted.'
        }
    }
}
