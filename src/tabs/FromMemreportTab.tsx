import  {useMemo} from 'react';

import { Column, DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import "@szhsin/react-menu/dist/core.css";
import '@szhsin/react-menu/dist/transitions/zoom.css';
import 'react-tabs/style/react-tabs.css';

interface SummaryRow {
    name: string;
    platform: string;
    physicalMemory: string;
    virtualMemory: string;
}


interface Row {
    name: string;
    value: string;
}

interface FromMemreportTabProps {
    fromMemreportLines: string[];
}

const FromMemreportTab: React.FC<FromMemreportTabProps> = ({fromMemreportLines}) => {
    let platform = '';
    let physicalMemory = '';
    let virtualMemory = '';

    fromMemreportLines.forEach((line) => {
        let name = '';
        let value = '';
        if (line.startsWith('Platform Memory Stats for')) {
            name = 'Platform';
            value = line.substring('Platform Memory Stats for:'.length).trim();
            platform = value;
        } else if (line.startsWith('Physical Memory:') || 
            line.startsWith('Virtual Memory:') ||
            line.startsWith('Process Physical Memory:') ||
            line.startsWith('Process Virtual Memory:')) {
            name = line.substring(0, line.indexOf(':')).trim();
            value = line.substring(line.indexOf(':')+1).trim();
            if (name === 'Physical Memory') {
                physicalMemory = value;
            } else if (name === 'Virtual Memory') {
                virtualMemory = value;
            }
        } else {
            value = line; 
        }
    });

    const columns = useMemo(() : readonly Column<Row, SummaryRow>[] => {
        return [
        { key: 'name', name: 'Summary',
            renderSummaryCell({row}: { row: SummaryRow }) {
                return `Platform: ${row.platform}, Physical Memory: ${row.physicalMemory}, Virtual Memory: ${row.virtualMemory}`;
            },
        },
        { key: 'value', name: '',
        },
        ]}, []);
    

    const rows : readonly Row[] = fromMemreportLines.map((line) => {        

        //let tokens = line.split(':');

        return { 
            name: "",
            value: line
        };
    });

    const summaryRows = useMemo((): readonly SummaryRow[] => {
        return [
            {
                name: 'Total',
                platform: platform,
                physicalMemory: physicalMemory,
                virtualMemory: virtualMemory
            }
        ];
    }, [rows]);

    return <>

                <DataGrid
                    topSummaryRows={summaryRows}
                    rows={rows}
                    columns={columns}
                    className = "summary-table"
                    defaultColumnOptions={{
                        resizable: true,
                        sortable: true,
                        draggable: true
                    }}/>
            </>

}

export default FromMemreportTab;