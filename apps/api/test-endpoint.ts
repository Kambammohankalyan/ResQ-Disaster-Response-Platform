
const checkApi = async () => {
    try {
        console.log('Testing GET http://localhost:4000/incidents/public ...');
        const res = await fetch('http://localhost:4000/incidents/public');
        
        console.log('Status:', res.status);
        
        if (res.status === 200) {
            const data = await res.json();
            console.log('Data count:', Array.isArray(data) ? data.length : 'Not an array');
            if (Array.isArray(data) && data.length > 0) {
                console.log('Data sample:', JSON.stringify(data[0], null, 2));
            }
        } else {
            console.log('Response Text:', await res.text());
        }
    } catch (error: any) {
        if (error.cause && error.cause.code === 'ECONNREFUSED') {
             console.error('❌ Connection Refused. The server is not running on port 4000.');
        } else {
             console.error('❌ Error:', error.message);
        }
    }
};

checkApi();
