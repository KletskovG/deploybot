dev:
	npm run dev

build:
	npm run build

start:
	npm run start

docker-env:
	cp .config/env/.env.production deployment/docker/deploybot.env

docker-build:
	docker compose -f deployment/docker/docker-compose.yml build

docker-up:
	docker compose -f deployment/docker/docker-compose.yml up -d

docker-down:
	docker compose -f deployment/docker/docker-compose.yml down

docker-logs:
	docker compose -f deployment/docker/docker-compose.yml logs -f

docker-restart:
	docker compose -f deployment/docker/docker-compose.yml restart

docker-ps:
	docker compose -f deployment/docker/docker-compose.yml ps

docker-pull: docker compose -f deployment/docker/docker-compose.yml pull

docker-deploy-local: docker-build docker-up

docker-deploy: docker-pull docker-up

docker-clean:
	docker image prune

# TODO: Delete
docker-login:
	@echo "Login to GitHub Container Registry"
	@read -p "GitHub Username: " username; \
	read -sp "GitHub Token (PAT): " token; \
	echo ""; \
	echo $$token | docker login ghcr.io -u $$username --password-stdin

docker-install-service:
	sudo cp deployment/docker/deploybot.service /etc/systemd/system/
	sudo systemctl daemon-reload
	sudo systemctl enable deploybot.service
	sudo systemctl start deploybot.service
	sudo systemctl status deploybot.service

docker-uninstall-service:
	sudo systemctl stop deploybot.service
	sudo systemctl disable deploybot.service
	sudo rm /etc/systemd/system/deploybot.service
	sudo systemctl daemon-reload

.DEFAULT_GOAL := dev