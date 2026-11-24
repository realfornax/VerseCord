.DEFAULT_GOAL := help

.PHONY: help init up down restart stop build

help:
	@printf '%s\n' \
		'make init     Create an env file from .env.example' \
		'make up       Build and start the Compose stack' \
		'make down     Remove Compose containers and networks' \
		'make restart  Restart containers' \
		'make stop     Stop containers' \
		'make build    Build images'

init:
	@if [ -e .env ] || [ -L .env ]; then \
		printf 'Keeping existing .env\n'; \
	else \
		(umask 077; set -C; cat .env.example > .env) && \
		printf 'Created .env. Edit DOMAIN, POSTGRES_PASSWORD, and WRTC_PUBLIC_IP before deploying.\n'; \
	fi

up:
	docker compose up -d --build

down:
	docker compose down

restart:
	docker compose restart

stop:
	docker compose stop

build:
	docker compose build
