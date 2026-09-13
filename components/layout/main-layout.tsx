import ConcentrationMap from "../dashboard/concentration-map";
import DashBoardHeader from "../dashboard/dashboard-header";
import SummaryCards from "../dashboard/SummaryCards";
import Table from "../table";

export default function MainLayout() {
    return(
        <main className="p-12" >
            <DashBoardHeader />
            <SummaryCards summary={{} as any} />
            <Table />
            <ConcentrationMap />
        </main>
    ) 
}