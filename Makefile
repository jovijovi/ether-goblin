APP_NAME:=ether-goblin
HUB:=$(if $(HUB),$(HUB),some_docker_image_repo)
OS:=linux
NODE_VER=16.17
TS_VER=$(shell tsc -v)
ALPINE_VER:=3.16

prj_dir:=$(shell pwd -L)
git_br:=$(shell git -C "${prj_dir}" rev-parse --abbrev-ref HEAD | grep -v HEAD || git describe --tags || git -C "${prj_dir}" rev-parse --short HEAD)
git_id:=$(if $(CI_COMMIT_SHORT_SHA),$(CI_COMMIT_SHORT_SHA),$(shell git rev-parse --short HEAD))
git_dir:=$(shell pwd -L|xargs basename)
build_dir:=$(prj_dir)/dist
app_dir:=$(build_dir)
docker_dir:=$(prj_dir)/docker

timestamp:=$(shell date -u '+%Y%m%d')
VER1:=$(if $(CI_COMMIT_TAG),$(CI_COMMIT_TAG).$(git_id),$(if $(CI_COMMIT_SHORT_SHA),$(CI_COMMIT_SHORT_SHA),$(git_br).$(git_id)))
VER:=$(if $(CI_Daily_Build),$(VER1).$(timestamp),$(VER1))

Version=$(VER)
GitCommit=$(git_id)
BuildTime=$(timestamp)
VERSION_INFO='{"version":"$(Version)","gitCommit":"$(GitCommit)","buildTime":"$(BuildTime)","tsVersion":"$(TS_VER)"}'

ifneq ($(unsafe_docker),)
DOCKER_FILE=./docker/Dockerfile.debug
else
DOCKER_FILE=./docker/Dockerfile
endif

.PHONY: build-prepare debug build docker push help clean

all: docker

build-prepare:
	@echo "[MAKEFILE] Prepare for building..."
	mkdir -p $(app_dir)

debug: build-prepare
	@echo "[MAKEFILE] Building debug"

build: build-prepare
	@echo "[MAKEFILE] Building binary"
	yarn install --frozen-lockfile
	yarn build
	@echo $(VERSION_INFO) > $(app_dir)/git.json

docker:
	@echo "[MAKEFILE] Building docker image..."
	@echo $(VERSION_INFO) > $(prj_dir)/git.json
	docker build --force-rm -f $(DOCKER_FILE) --build-arg NODE_VER=$(NODE_VER) -t $(APP_NAME):$(VER) .
	docker tag $(APP_NAME):$(VER) $(APP_NAME):latest
	docker images|grep $(APP_NAME)
	@echo "[MAKEFILE] Build docker image done"

push: docker
	@echo "[MAKEFILE] Pushing docker image..."
	docker tag $(APP_NAME):$(VER) $(HUB)/$(APP_NAME):$(VER)
	docker push $(HUB)/$(APP_NAME):$(VER)
	@echo "[MAKEFILE] Done"

clean:
	yarn clean
	@echo "[MAKEFILE] Cleaned"

help:
	@echo "make build -- Compile code"
	@echo "make docker -- Build docker image"
	@echo "make push -- Push docker image to registry"
