from django.db import models
from django.contrib.auth.models import User, Group

class Programme(models.Model):
    nom = models.CharField(max_length=100, unique=True, verbose_name="Nom du Programme/Financement")
    code = models.CharField(max_length=50, unique=True, verbose_name="Code Programme (ex: GAVI, FM)")

    def __str__(self):
        return f"{self.nom} ({self.code})"

class Poste(models.Model):
    nom = models.CharField(max_length=150, verbose_name="Intitulé du Poste")
    programme = models.ForeignKey(
        Programme, 
        on_delete=models.PROTECT, 
        related_name="postes",
        verbose_name="Programme rattaché"
    )
    groups = models.ManyToManyField(
        Group, 
        blank=True, 
        related_name="postes",
        verbose_name="Groupes Django (Permissions)"
    )
    superieurs = models.ManyToManyField(
        'self', 
        symmetrical=False, 
        blank=True, 
        related_name="subordonnes",
        verbose_name="Supérieurs hiérarchiques"
    )

    class Meta:
        unique_together = ('nom', 'programme')

    def __str__(self):
        return f"{self.nom} - {self.programme.code}"

class AgentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='agent_profile')
    poste = models.ForeignKey(Poste, on_delete=models.SET_NULL, null=True, blank=True, related_name="agents")
    matricule = models.CharField(max_length=50, unique=True, null=True, blank=True)
    sexe = models.IntegerField(choices=((1, 'Masculin'), (2, 'Féminin')), null=True, blank=True)
    telephone = models.CharField(max_length=20, blank=True, default='')
    service = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profil de {self.user.username} ({self.poste})"
