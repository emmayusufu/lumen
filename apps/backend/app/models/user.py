from dataclasses import dataclass


@dataclass
class User:
    id: str
    org_id: str
    email: str
