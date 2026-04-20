from django.db import models

class Fournisseur(models.Model):
    nom = models.CharField(max_length=255, unique=True)
    email = models.EmailField()
    telephone = models.CharField(max_length=50, blank=True)
    adresse = models.TextField(blank=True)
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["nom"]

    def __str__(self):
        return self.nom
