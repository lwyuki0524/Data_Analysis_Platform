from fastapi import APIRouter, HTTPException
from models.schemas import (
    QueryRequest,
    DatasetRegisterRequest,
    GetColumnsResponse,
    CreateDashboardRequest,
    CreateDashboardResponse,
    DashboardConfig,
    ChartWidget,
    KpiWidget,
    ChartDataPoint
)
from services.orchestrator import Orchestrator
from services.data_loader import DataLoader
from services.insight_engine import InsightEngine
from services.visualization_engine import VisualizationEngine

router = APIRouter()

loader = DataLoader()
orchestrator = Orchestrator(loader)
insight_engine = InsightEngine()
visualization_engine = VisualizationEngine()


@router.post("/dataset/register")
def register_dataset(req: DatasetRegisterRequest):
    df = loader.load(req.dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found or could not be loaded")
    return {"dataset_id": req.dataset_id}


@router.get("/dataset/{dataset_id}/columns", response_model=GetColumnsResponse)
def get_dataset_columns(dataset_id: str):
    columns = loader.get_columns(dataset_id)
    if not columns:
        raise HTTPException(status_code=404, detail="Dataset not found or has no columns")
    return GetColumnsResponse(columns=columns)


@router.post("/dashboard/create", response_model=CreateDashboardResponse)
def create_dashboard(req: CreateDashboardRequest):
    df = loader.load(req.dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found or could not be loaded")

    selected_columns = req.focus_fields
    if not selected_columns:
        # AI automatically determines important columns
        selected_columns = insight_engine.identify_important_columns(df)
    
    if not selected_columns:
        raise HTTPException(status_code=400, detail="No columns selected or identified for dashboard generation")

    charts = visualization_engine.generate_dashboard_charts(df, selected_columns)
    # For simplicity, let's just return charts for now. KPI generation can be added later.
    dashboard_config = DashboardConfig(widgets=charts)

    # In a real scenario, you'd save this dashboard config to a DB and return an ID
    # For this example, we'll just return a dummy dashboard_id
    return CreateDashboardResponse(dashboard_id="new-dashboard-123", dashboard_config=dashboard_config)


@router.post("/query")
def query(req: QueryRequest):
    return orchestrator.run(req.dataset_id, req.question)