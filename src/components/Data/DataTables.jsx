import DataTable from "../DataTable"

const DataTables = () => {
    const users = [
        { 
        id: 1, 
        name: "Alice Johnson", 
        subscription: "Premium Plan", 
        status: "Active", 
        validity: "2024-12-31" 
        },
        { 
        id: 2, 
        name: "Bob Smith", 
        subscription: "Basic Plan", 
        status: "Expired", 
        validity: "2023-11-15" 
        },
        { 
        id: 3, 
        name: "Charlie Davis", 
        subscription: "Pro Plan", 
        status: "Active", 
        validity: "2024-06-20" 
        },
    ];

    const columns = [
        { 
        header: "Name", 
        accessor: "name", 
        render: (row) => (
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                <img 
                src={`https://ui-avatars.com/api/?name=${row.name}&background=random`} 
                alt="Avatar" 
                className="w-full h-full object-cover"
                />
            </div>
            <span className="font-medium text-gray-900">{row.name}</span>
            </div>
        )
        },
        { header: "Subscription", accessor: "subscription" },
        { 
        header: "Subscription Status", 
        accessor: "status",
        render: (row) => (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            row.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
            }`}>
            {row.status}
            </span>
        )
        },
        { 
        header: "Validity", 
        accessor: "validity",
        render: (row) => <span className="text-gray-600 font-mono">{row.validity}</span>
        },
        {
        header: "Action",
        render: (row) => (
            <div className="flex gap-2">
            <button onClick={() => alert(`Edit ${row.name}`)} className="text-blue-600 hover:underline">Edit</button>
            <button onClick={() => alert(`Delete ${row.id}`)} className="text-red-600 hover:underline">Delete</button>
            </div>
        )
        }
    ]

    const equipmentData = [
        { 
            id: 101, 
            name: "Treadmill 5000", 
            category: "Cardio", 
            condition: "Operational", 
            dateAcquired: "2024-01-10",
            image: "https://placehold.co/100x100/e2e8f0/1e293b?text=Treadmill" 
        },
        { 
            id: 102, 
            name: "Dumbbell Set (5-50lbs)", 
            category: "Free Weights", 
            condition: "Good", 
            dateAcquired: "2023-12-05",
            image: "https://placehold.co/100x100/e2e8f0/1e293b?text=Dumbbells"
        },
    ];

    const equipmentColumns = [
        { 
        header: "Equipment Name", 
        accessor: "name", 
        render: (row) => (
            <div className="flex items-center gap-4">
            <div className="w-16 h-12 rounded bg-gray-200 overflow-hidden border border-gray-300">
                <img src={row.image} alt={row.name} className="w-full h-full object-cover"/>
            </div>
            <div>
                <div className="font-bold text-gray-900">{row.name}</div>
                <div className="text-xs text-gray-500">{row.category}</div>
            </div>
            </div>
        )
        },
        { header: "Condition", accessor: "condition" },
        { 
            header: "Date Acquired", 
            accessor: "dateAcquired",
            render: (row) => <span className="font-mono text-gray-600">{row.dateAcquired}</span>
        },
        {
            header: "Manage",
            render: (row) => <button className="text-indigo-600 hover:underline">Report Issue</button>
        }
    ];

    return (
        <div className="p-10 bg-gray-50 min-h-screen space-y-12">
        <section>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">User Subscriptions</h1>
            <DataTable data={users} columns={columns} />
        </section>

        <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Equipment Inventory</h2>
            <DataTable data={equipmentData} columns={equipmentColumns} />
        </section>
        </div>
    );
};

export default DataTables;