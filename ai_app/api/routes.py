from fastapi import APIRouter
from models.schemas import QueryRequest, DatasetRegisterRequest
from services.orchestrator import Orchestrator
from services.data_loader import DataLoader

router = APIRouter()

loader = DataLoader()
orchestrator = Orchestrator(loader)


@router.post("/dataset/register")
def register_dataset(req: DatasetRegisterRequest):
    df = loader.load(req.dataset_id)
    return {"dataset_id": req.dataset_id}


@router.post("/query")
def query(req: QueryRequest):
    return orchestrator.run(req.dataset_id, req.question)