M                := $(shell printf "\033[34;1m>>\033[0m")

.PHONY: migrate
migrate:
	$(info $(M) running DB migrations...)
	docker-compose exec web python manage.py makemigrations main
	docker-compose exec web python manage.py migrate

.PHONY: test_users
test_users:
	$(info $(M) creating test users...)
	./create_test_users

.PHONY: super_user
super_user:
	$(info $(M) creating superuser...)
	docker-compose exec web python manage.py createsuperuser