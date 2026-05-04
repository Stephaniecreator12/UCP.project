class Financing(models.Model):
    name = models.CharField(max_length=100, choices=FinancingSource.choices)

    def __str__(self):
        return self.get_name_display()