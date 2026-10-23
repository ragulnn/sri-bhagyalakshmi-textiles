
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
        REPORT_DIR = 'reports'
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
                        set +e

                        npm ci > ../reports/test-results/backend-install.log 2>&1
                        install_status=$?

                        if [ "$install_status" -eq 0 ]; then
                            npm run typecheck > ../reports/test-results/backend-typecheck.log 2>&1
                            typecheck_status=$?

                            npm test > ../reports/test-results/backend-test.log 2>&1
                            test_status=$?
                        else
                            typecheck_status=1
                            test_status=1
                        fi

                        printf 'install=%s\\ntypecheck=%s\\ntest=%s\\n' \
                            "$install_status" "$typecheck_status" "$test_status" \
                            > ../reports/test-results/backend-status.txt

                        if [ "$install_status" -ne 0 ] || \
                           [ "$typecheck_status" -ne 0 ] || \
                           [ "$test_status" -ne 0 ]; then
                            exit 1
                        fi
                    '''
                }
            }
        }

        stage('Backend Coverage') {
            steps {
                dir('backend') {
                    sh '''
                        set +e

                        npx c8 \
                            --reporter=text \
                            --reporter=lcov \
                            --reports-dir=coverage \
                            node --import tsx --test tests/*.test.ts \
                            > ../reports/test-results/backend-coverage.log 2>&1

                        result=$?

                        if [ -d coverage ]; then
                            cp -R coverage ../reports/coverage/backend
                        fi

                        echo "$result" > ../reports/coverage/backend-exit-code.txt
                        exit "$result"
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
                                set +e
                                npm run test:integration \
                                    > ../reports/test-results/api-integration.log 2>&1
                                result=$?
                                echo "$result" > ../reports/test-results/api-integration-exit-code.txt
                                exit "$result"
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
                        set +e

                        npm ci > ../reports/test-results/frontend-install.log 2>&1
                        install_status=$?

                        if [ "$install_status" -eq 0 ]; then
                            npm run build > ../reports/test-results/frontend-build.log 2>&1
                            build_status=$?

                            npm run test:coverage > ../reports/test-results/frontend-coverage.log 2>&1
                            test_status=$?
                        else
                            build_status=1
                            test_status=1
                        fi

                        if [ -d coverage ]; then
                            cp -R coverage ../reports/coverage/frontend
                        fi

                        printf 'install=%s\\nbuild=%s\\ntest_coverage=%s\\n' \
                            "$install_status" "$build_status" "$test_status" \
                            > ../reports/test-results/frontend-status.txt

                        if [ "$install_status" -ne 0 ] || \
                           [ "$build_status" -ne 0 ] || \
                           [ "$test_status" -ne 0 ]; then
                            exit 1
                        fi
                    '''
                }
            }
        }

        stage('Verify Coverage Reports') {
            steps {
                sh '''
                    set -eu

                    find reports/coverage -type f -print \
                        > reports/coverage/files.txt

                    if [ ! -d reports/coverage/backend ] && \
                       [ ! -d reports/coverage/frontend ]; then
                        echo "No coverage output was found."
                        exit 1
                    fi
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'

                    withSonarQubeEnv('Local-SonarQube') {
                        sh '''
                            set +e

                            "$SONAR_SCANNER_PATH/bin/sonar-scanner" \
                                -Dsonar.projectKey=sri-bhagyalakshmi-textiles \
                                -Dsonar.sources=backend,frontend \
                                -Dsonar.qualitygate.wait=true \
                                > reports/sonarqube/scanner.log 2>&1

                            result=$?
                            echo "$result" > reports/sonarqube/scanner-exit-code.txt
                            exit "$result"
                        '''.replace(
                            '$SONAR_SCANNER_PATH',
                            "${scannerHome}"
                        )
                    }
                }
            }
        }

        stage('Dependency Audit') {
            steps {
                script {
                    def auditStatus = 0

                    dir('backend') {
                        sh '''
                            set +e
                            npm audit --json \
                                > ../reports/security/backend-npm-audit.json 2>&1
                            echo "$?" > ../reports/security/backend-npm-audit-exit-code.txt
                            exit 0
                        '''
                    }

                    dir('frontend') {
                        sh '''
                            set +e
                            npm audit --json \
                                > ../reports/security/frontend-npm-audit.json 2>&1
                            echo "$?" > ../reports/security/frontend-npm-audit-exit-code.txt
                            exit 0
                        '''
                    }

                    sh '''
                        python3 - <<'PY'
import json
from pathlib import Path

failed = False

for path in [
    Path("reports/security/backend-npm-audit.json"),
    Path("reports/security/frontend-npm-audit.json"),
]:
    try:
        data = json.loads(path.read_text())
        metadata = data.get("metadata", {}).get("vulnerabilities", {})
        print(f"{path}: {metadata}")
        if any(metadata.get(level, 0) for level in ("high", "critical")):
            failed = True
    except Exception as exc:
        print(f"Could not parse {path}: {exc}")
        failed = True

Path("reports/security/audit-gate.txt").write_text(
    "FAIL: high or critical vulnerabilities found, or report invalid\\n"
    if failed else "PASS: no high or critical vulnerabilities reported\\n"
)

raise SystemExit(1 if failed else 0)
PY
                    '''
                }
            }
        }

        stage('Gitleaks Scan') {
            steps {
                sh '''
                    set +e

                    gitleaks detect \
                        --source . \
                        --report-format json \
                        --report-path reports/security/gitleaks.json \
                        --no-banner \
                        > reports/security/gitleaks.log 2>&1

                    result=$?
                    echo "$result" > reports/security/gitleaks-exit-code.txt
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

        stage('Trivy Image Scans') {
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
                    backend_scan_status=$?

                    trivy image \
                        --format json \
                        --output reports/trivy/frontend.json \
                        --severity HIGH,CRITICAL \
                        --exit-code 0 \
                        "$FRONTEND_IMAGE:$BUILD_NUMBER" \
                        > reports/trivy/frontend.log 2>&1
                    frontend_scan_status=$?

                    printf 'backend_scan=%s\\nfrontend_scan=%s\\n' \
                        "$backend_scan_status" "$frontend_scan_status" \
                        > reports/trivy/scan-status.txt

                    if [ "$backend_scan_status" -ne 0 ] || \
                       [ "$frontend_scan_status" -ne 0 ]; then
                        exit 1
                    fi

                    python3 - <<'PY'
import json
from pathlib import Path

failed = False

for path in [
    Path("reports/trivy/backend.json"),
    Path("reports/trivy/frontend.json"),
]:
    try:
        data = json.loads(path.read_text())
        for result in data.get("Results", []):
            for vuln in result.get("Vulnerabilities") or []:
                severity = vuln.get("Severity", "").upper()
                if severity in ("HIGH", "CRITICAL"):
                    failed = True
                    print(f"{path}: {severity} {vuln.get('VulnerabilityID', 'unknown')}")
    except Exception as exc:
        print(f"Unable to parse {path}: {exc}")
        failed = True

Path("reports/trivy/quality-gate.txt").write_text(
    "FAIL: HIGH/CRITICAL vulnerabilities found or scan report invalid\\n"
    if failed else "PASS: no HIGH/CRITICAL vulnerabilities found\\n"
)

raise SystemExit(1 if failed else 0)
PY
                '''
            }
        }

        stage('Push Docker Images') {
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
                            -u "$DOCKERHUB_USER" --password-stdin

                        docker tag "$BACKEND_IMAGE:$BUILD_NUMBER" \
                            "$DOCKERHUB_REPO-backend:$BUILD_NUMBER"

                        docker tag "$FRONTEND_IMAGE:$BUILD_NUMBER" \
                            "$DOCKERHUB_REPO-frontend:$BUILD_NUMBER"

                        docker push "$DOCKERHUB_REPO-backend:$BUILD_NUMBER"
                        docker push "$DOCKERHUB_REPO-frontend:$BUILD_NUMBER"

                        docker logout
                    '''
                }
            }
        }
    }

    post {
        always {
            script {
                sh '''
                    set +e

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
                } catch (Exception archiveError) {
                    echo "REPORT_ARCHIVE_FAILED: ${archiveError.message}"
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
                                echo "No report files changed; nothing to commit."
                            else
                                git commit -m "Add CI reports for build $BUILD_NUMBER"
                                git push origin HEAD:main
                            fi

                            echo "REPORT_PUSH_SUCCESS"
                        '''
                    }
                } catch (Exception publishError) {
                    echo "REPORT_PUSH_FAILED: ${publishError.message}"
                    echo "The CI result remains ${currentBuild.currentResult}; report publishing failed separately."
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
            echo 'CI pipeline completed successfully.'
        }

        failure {
            echo 'CI pipeline failed. Available reports were archived and report publishing was attempted.'
        }
    }
}
