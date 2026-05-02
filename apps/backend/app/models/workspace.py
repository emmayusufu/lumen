import uuid
from dataclasses import dataclass


@dataclass
class Workspace:
    id: uuid.UUID
    slug: str
    name: str
    role: str
