#!/bin/bash

# BitvmX Explorer 환경 설정 스크립트
# 색상 코드 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}BitvmX Explorer 환경 설정 시작${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""

# Node.js 버전 확인
check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Node.js가 설치되지 않았습니다.${NC}"
        echo -e "${YELLOW}Node.js를 설치합니다...${NC}"
        
        # macOS인 경우
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if command -v brew &> /dev/null; then
                brew install node
            else
                echo -e "${RED}Homebrew가 설치되지 않았습니다.${NC}"
                echo -e "${YELLOW}https://nodejs.org 에서 Node.js를 직접 설치해주세요.${NC}"
                exit 1
            fi
        # Linux인 경우
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
            sudo apt-get install -y nodejs
        else
            echo -e "${RED}지원하지 않는 운영체제입니다.${NC}"
            echo -e "${YELLOW}https://nodejs.org 에서 Node.js를 직접 설치해주세요.${NC}"
            exit 1
        fi
    fi
    
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js 버전: $NODE_VERSION${NC}"
}

# npm 버전 확인
check_npm() {
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}npm이 설치되지 않았습니다.${NC}"
        exit 1
    fi
    
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm 버전: $NPM_VERSION${NC}"
}

# pnpm 설치 확인 및 설치
check_pnpm() {
    if ! command -v pnpm &> /dev/null; then
        echo -e "${YELLOW}pnpm이 설치되지 않았습니다. 설치를 진행합니다...${NC}"
        npm install -g pnpm
    fi
    
    if command -v pnpm &> /dev/null; then
        PNPM_VERSION=$(pnpm -v)
        echo -e "${GREEN}✓ pnpm 버전: $PNPM_VERSION${NC}"
    fi
}

# 기존 node_modules 및 lock 파일 정리
clean_project() {
    echo ""
    echo -e "${YELLOW}기존 설치 파일을 정리합니다...${NC}"
    
    if [ -d "node_modules" ]; then
        echo "node_modules 디렉토리 삭제 중..."
        rm -rf node_modules
    fi
    
    if [ -f "package-lock.json" ]; then
        echo "package-lock.json 삭제 중..."
        rm -f package-lock.json
    fi
    
    if [ -f "pnpm-lock.yaml" ]; then
        echo "pnpm-lock.yaml 삭제 중..."
        rm -f pnpm-lock.yaml
    fi
    
    echo -e "${GREEN}✓ 정리 완료${NC}"
}

# 의존성 설치
install_dependencies() {
    echo ""
    echo -e "${YELLOW}의존성 패키지를 설치합니다...${NC}"
    
    # npm 캐시 정리
    npm cache clean --force
    
    # npm으로 설치 (pnpm이 없는 경우를 대비)
    if command -v pnpm &> /dev/null; then
        echo "pnpm을 사용하여 설치합니다..."
        pnpm install
    else
        echo "npm을 사용하여 설치합니다..."
        npm install
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 의존성 설치 완료${NC}"
    else
        echo -e "${RED}✗ 의존성 설치 실패${NC}"
        exit 1
    fi
}

# Vite 설정 파일 확인
check_vite_config() {
    echo ""
    echo -e "${YELLOW}Vite 설정 파일을 확인합니다...${NC}"
    
    if [ -f "vite.config.js" ] || [ -f "vite.config.ts" ] || [ -f "vite.config.mjs" ]; then
        echo -e "${GREEN}✓ Vite 설정 파일이 존재합니다${NC}"
    else
        echo -e "${RED}✗ Vite 설정 파일이 없습니다${NC}"
        echo -e "${YELLOW}vite.config.js 파일을 생성해야 할 수 있습니다.${NC}"
    fi
}

# 환경 변수 파일 확인
check_env() {
    echo ""
    echo -e "${YELLOW}환경 변수 파일을 확인합니다...${NC}"
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ] || [ -f ".env.sample" ]; then
            echo -e "${YELLOW}.env 파일이 없습니다. 샘플 파일을 복사합니다...${NC}"
            if [ -f ".env.example" ]; then
                cp .env.example .env
            else
                cp .env.sample .env
            fi
            echo -e "${GREEN}✓ .env 파일 생성 완료${NC}"
            echo -e "${YELLOW}⚠ .env 파일의 설정값을 확인해주세요${NC}"
        else
            echo -e "${YELLOW}⚠ .env 파일이 없습니다. 필요한 경우 생성해주세요.${NC}"
        fi
    else
        echo -e "${GREEN}✓ .env 파일이 존재합니다${NC}"
    fi
}

# 개발 서버 실행 테스트
test_dev_server() {
    echo ""
    echo -e "${YELLOW}개발 서버 실행을 테스트합니다...${NC}"
    echo -e "${YELLOW}5초 후 자동으로 종료됩니다...${NC}"
    
    timeout 5 npm run dev &> /dev/null
    
    if [ $? -eq 124 ] || [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 개발 서버가 정상적으로 시작되었습니다${NC}"
    else
        echo -e "${RED}✗ 개발 서버 실행 중 오류가 발생했습니다${NC}"
        echo -e "${YELLOW}npm run dev를 직접 실행하여 오류를 확인해주세요${NC}"
    fi
}

# 메인 실행 함수
main() {
    # 1. Node.js 확인
    check_node
    
    # 2. npm 확인
    check_npm
    
    # 3. pnpm 확인 (선택사항)
    check_pnpm
    
    # 4. 프로젝트 정리
    clean_project
    
    # 5. 의존성 설치
    install_dependencies
    
    # 6. Vite 설정 확인
    check_vite_config
    
    # 7. 환경 변수 확인
    check_env
    
    # 8. 개발 서버 테스트
    test_dev_server
    
    echo ""
    echo -e "${GREEN}=====================================${NC}"
    echo -e "${GREEN}환경 설정이 완료되었습니다!${NC}"
    echo -e "${GREEN}=====================================${NC}"
    echo ""
    echo -e "${YELLOW}다음 명령어로 개발 서버를 실행하세요:${NC}"
    echo -e "${GREEN}npm run dev${NC}"
    echo ""
    echo -e "${YELLOW}또는 pnpm을 사용하는 경우:${NC}"
    echo -e "${GREEN}pnpm dev${NC}"
}

# 스크립트 실행
main