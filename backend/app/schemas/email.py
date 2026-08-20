from pydantic import BaseModel, EmailStr


class EmailData(BaseModel):

    to: EmailStr

    subject: str

    body: str