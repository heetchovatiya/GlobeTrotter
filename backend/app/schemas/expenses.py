from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.models import ExpenseCategory


class ExpensePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    trip_id: int
    category: ExpenseCategory
    amount: float
    section_id: int | None = None
    note: str | None = None
    expense_date: date | None = None
    receipt_url: str | None = None
    is_manual: bool = False


class ExpenseCreate(BaseModel):
    category: ExpenseCategory
    amount: float = Field(gt=0)
    expense_date: date
    note: str | None = Field(default=None, max_length=2000)
    receipt_url: str | None = Field(default=None, max_length=512)


class ExpenseUpdate(BaseModel):
    category: ExpenseCategory | None = None
    amount: float | None = Field(default=None, gt=0)
    expense_date: date | None = None
    note: str | None = Field(default=None, max_length=2000)
    receipt_url: str | None = Field(default=None, max_length=512)
