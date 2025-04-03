class Shop(models.Model):
    google_calendar_credentials = models.JSONField(null=True, blank=True) 