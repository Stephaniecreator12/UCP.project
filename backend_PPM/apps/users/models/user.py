# employee.py
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, Group, Permission, PermissionsMixin
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _

class UserProfileManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'adresse email est obligatoire")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class UserProfile(AbstractBaseUser, PermissionsMixin):
    full_name = models.CharField("Nom complet", max_length=255, unique=True,blank=True,null=True,)
    email = models.EmailField("Email professionnel", unique=True)

    phone_regex = RegexValidator(
        regex=r'^\+261\s\d{2}\s\d{3}\s\d{2}$',
        message="Le format doit être : +261 XX XXX XX"
    )
    phone = models.CharField(validators=[phone_regex], max_length=17,blank=True,
        null=True)

    ENTITE_CHOICES = [
        ('ENTREPRISE', 'Entreprise'),
        ('BUREAU_ETUDES', 'Bureau d’études'),
        ('ONG', 'ONG'),
        ('PARTICULIER', 'Particulier'),
        ('CONSULTANT', 'Consultant'),
    ]
    type_entite = models.CharField(max_length=20, choices=ENTITE_CHOICES,blank=True,
        null=True)
    nif = models.CharField("NIF", max_length=20, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserProfileManager()

    @property
    def username(self):
        return self.email

    def get_full_name(self):
        return self.full_name or self.email

    def get_short_name(self):
        return self.email

    @property
    def first_name(self):
        parts = (self.full_name or "").split(" ", 1)
        return parts[0] if parts and parts[0] else ""

    @property
    def last_name(self):
        parts = (self.full_name or "").split(" ", 1)
        return parts[1] if len(parts) > 1 else ""

    def __str__(self):
        return self.email