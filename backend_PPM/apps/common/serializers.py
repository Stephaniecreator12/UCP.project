from rest_framework import serializers


class DynamicChoiceField(serializers.ChoiceField):
    """ChoiceField dont les choix sont évalués à la volée (per instance).

    Permet de brancher des choix stockés en base (ReferenceChoice), éditables
    via l'admin Django, sans avoir à redémarrer le serveur pour que les
    modifications soient prises en compte par l'API.
    """

    def __init__(self, *args, **kwargs):
        self._choice_callable = None
        choices = kwargs.get("choices")
        if callable(choices):
            self._choice_callable = choices
            kwargs["choices"] = []
        super().__init__(*args, **kwargs)

    def _resolve_choices(self):
        if self._choice_callable is not None:
            self._set_choices(self._choice_callable())
        return self

    def to_internal_value(self, data):
        self._resolve_choices()
        return super().to_internal_value(data)

    def to_representation(self, value):
        self._resolve_choices()
        return super().to_representation(value)
