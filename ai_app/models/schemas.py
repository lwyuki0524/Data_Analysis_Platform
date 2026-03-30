from pydantic import BaseModel


class DatasetRegisterRequest(BaseModel):
    dataset_id: str


class QueryRequest(BaseModel):
    dataset_id: str
    question: str