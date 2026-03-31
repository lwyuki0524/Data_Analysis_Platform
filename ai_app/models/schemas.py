from typing import List, Literal, Optional, Dict, Any, Union
from pydantic import BaseModel, Field


class DatasetRegisterRequest(BaseModel):
    dataset_id: str


class QueryRequest(BaseModel):
    dataset_id: str
    question: str


class GetColumnsResponse(BaseModel):
    columns: List[str]


class ChartDataPoint(BaseModel):
    name: Union[int, float, str]
    value: Union[int, float, str]


class ChartWidget(BaseModel):
    title: str
    type: Literal["bar", "line", "scatter", "table", "area", "histogram"]
    data: List[ChartDataPoint]
    
    # Optional Vega-Lite spec if more complex charts are needed
    vega_lite_spec: Optional[Dict[str, Any]] = None


class KpiWidget(BaseModel):
    title: str
    value: str
    trend: str # e.g., "+5%", "-2.1%"
    type: str


class DashboardConfig(BaseModel):
    widgets: List[ChartWidget | KpiWidget]


class CreateDashboardRequest(BaseModel):
    dataset_id: str
    focus_fields: Optional[List[str]] = None


class CreateDashboardResponse(BaseModel):
    dashboard_id: str
    dashboard_config: DashboardConfig