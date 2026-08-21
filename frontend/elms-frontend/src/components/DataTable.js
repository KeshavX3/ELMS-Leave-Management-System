function DataTable({ columns, data, actions }) {
  return <div className="table-card"><div className="table-scroll"><table className="data-table"><thead><tr>{columns.map(column => <th key={column.key}>{column.label}</th>)}{actions && <th className="actions-heading">Actions</th>}</tr></thead><tbody>{data.map(item => <tr key={item.id}>{columns.map(column => <td key={column.key}>{item[column.key]}</td>)}{actions && <td className="table-actions">{actions(item)}</td>}</tr>)}</tbody></table></div></div>;
}

export default DataTable;
