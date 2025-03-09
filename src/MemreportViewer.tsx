import  {useMemo, useState} from 'react';

import 'react-data-grid/lib/styles.css';
import { DataGrid, SortColumn } from 'react-data-grid';
import FileUpload from './FileUpload'

const textureColumns = [
    { key: 'name', name: 'Name'},
    { key: 'cookedDim', name: 'Cooked Width / Height'},
    { key: 'cookedSize', name: 'Cooked'},
    { key: 'currentDim', name: 'Current Width / Height'},
    { key: 'currentSize', name: 'CurrentMem'}, 
    { key: 'format', name: 'Format'}, 
    { key: 'lodGroup', name: 'LODGroup'}, 
    { key: 'streaming', name: 'Streaming'}, 
    { key: 'vt', name: 'VT'}, 
    { key: 'usageCount', name: 'Usage Count'},
    { key: 'numMips', name: 'NumMips'},
    { key: 'uncompressed', name: 'Uncompressed'},
];

interface SummaryRow {
    id: string;
    totalCount: number;
}


const Memreport: React.FC = () => {
    const [linesArray, setLinesArray] = useState<string[]>([]);
    const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
    const NUM_LISTTEXTURES_COLUMNS = 12;

    const handleSetLinesArray = (lines: string[]) => {
        const beginMarker = 'MemReport: Begin command "listtextures';
        const endMarker = 'MemReport: End command "listtextures';
        let capturing = false;
        let skipCount = 0;
        const filteredLines = lines.filter(line => {
          if (line.trim() === '') return false;
          if (line.startsWith(beginMarker)) {
            capturing = true;
            skipCount = 0;
            return false;
          }
          if (line.startsWith(endMarker)) {
            capturing = false;
            return false;
          }
          if (capturing) {
            if (skipCount < 2) {
              skipCount++;
              return false;
            }
            if (line.split(',').length < NUM_LISTTEXTURES_COLUMNS) return false;
            return true;
          }          
          return false;
        });

        setLinesArray(filteredLines);
    }

    interface Row {
        name: string;
        cookedDim: string;
        cookedSize: number; // KB
        currentDim: string;
        currentSize: number; // KB
        format: string;
        lodGroup: string;
        streaming: string;
        vt: string;
        usageCount: string;
        numMips: string;
        uncompressed: string;
    }

    const rows : readonly Row[] = linesArray.map((line) => {

        // Parse this:
        // Cooked/OnDisk: Width x Height (Size in KB, Authored Bias), Current/InMem: Width x Height (Size in KB), Format, LODGroup, Name, Streaming, UnknownRef, VT, Usage Count, NumMips, Uncompressed
        // 2048x2048 (32768 KB, ?), 2048x2048 (32768 KB), PF_FloatRGBA, TEXTUREGROUP_World, /Engine/EngineMaterials/DefaultBloomKernel.DefaultBloomKernel, NO, NO, NO, 0, 1, YES

        let tokens = line.split(',');

        // Parse width and height from the first token
        const matchDimensions = (tokens: string): [number, number] => {
            const match = tokens.match(/(\d+)x(\d+)/);
            if (match) {
                return [parseInt(match[1], 10), parseInt(match[2], 10)];
            }
            return [0, 0];
        }

        let [cookedWidth, cookedHeight] = matchDimensions(tokens[0]);
        let cookedSize = parseInt(tokens[0].match(/\((\d+) KB/)?.[1] || '0', 10);

        let [currentWidth, currentHeight] = matchDimensions(tokens[2]);
        let currentSize = parseInt(tokens[2].match(/\((\d+) KB\)/)?.[1] || '0', 10);

        return { 
            name: tokens[5],
            cookedDim: cookedWidth + 'x' + cookedHeight,
            cookedSize: cookedSize,
            currentDim: currentWidth + 'x' + currentHeight,
            currentSize: currentSize,
            format: tokens[3],
            lodGroup: tokens[4],
            streaming: tokens[6],
            vt: tokens[8],
            usageCount: tokens[9],
            numMips: tokens[10],
            uncompressed: tokens[11]
        };
    });

    type Comparator = (a: Row, b: Row) => number;

    function getComparator(sortColumn: string): Comparator {
        switch (sortColumn) {
            case 'name':
            case 'lodGroup':
            case 'format':
            case 'streaming':
            case 'vt':
            case 'uncompressed':
                return (a, b) => {
                    const aValue = a[sortColumn] || '';
                    const bValue = b[sortColumn] || '';
                    return aValue.localeCompare(bValue);
                };
            case 'cookedDim':
            case 'currentDim':
                return (a, b) => {
                    const aWidthHeight = a[sortColumn].split('x').map((x) => parseInt(x, 10));
                    const bWidthHeight = b[sortColumn].split('x').map((x) => parseInt(x, 10));
                    return aWidthHeight[0] - bWidthHeight[0] || aWidthHeight[1] - bWidthHeight[1];
                };
            case 'cookedSize':
            case 'currentSize':
                return (a, b) => a[sortColumn] - b[sortColumn];
          default:
            throw new Error(`unsupported sortColumn: "${sortColumn}"`);
        }
      }

    const sortedRows = useMemo((): readonly Row[] => {
        if (sortColumns.length === 0) return rows;

        return [...rows].sort((a, b) => {
            for (const sort of sortColumns) {
                const comparator = getComparator(sort.columnKey);
                const compResult = comparator(a, b);
                if (compResult !== 0) return sort.direction === 'ASC' ? compResult : -compResult;
            }
            return 0;
        });
        }, [rows, sortColumns]);
    
    const summaryRows = useMemo((): readonly SummaryRow[] => {
        return [
            {
                id: 'total_0',
                totalCount: rows.length,
            }
        ];
    }, [rows]);


    return <div className="memreport-container">
        <p>Upload .memreport file</p>

        <FileUpload setLinesArray={handleSetLinesArray}/>

        <div className="datagrid-container">
        <DataGrid
            topSummaryRows={summaryRows}
            rows={sortedRows}
            columns={textureColumns}
            sortColumns={sortColumns}
            onSortColumnsChange={setSortColumns}
            defaultColumnOptions={{
                resizable: true,
                sortable: true,
                draggable: true
            }}/>
        </div>
    </div>

}

export default Memreport;