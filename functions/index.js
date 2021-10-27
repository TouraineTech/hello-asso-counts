const functions = require('firebase-functions');
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.getAttendeesCount = functions.https.onRequest((request, response) => {
    let isPost = request.method === 'POST';
    let data = main(isPost);
    data.then(d => response.send(d))
        .catch((e) => response.send(`{ 'Error': true, 'details': ${e}}`));
});


const { fetch } = require('cross-fetch');
const config = require('./config.json');

async function getAccessToken() {
    let formData = new URLSearchParams();
    formData.append("client_id", config.clientId);
    formData.append("client_secret", config.clientSecret);
    formData.append("grant_type", "client_credentials");
    const response = await fetch('https://api.helloasso.com/oauth2/token',
        {
            "method": "POST",
            "body": formData,
            "headers": {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }).then(r => r.json());
    return response.access_token
}

async function getAllAttendees(accessToken, page) {
    const response = await fetch('https://api.helloasso.com/v5/organizations/touraine-tech/items?pageIndex=' + page + '&pageSize=100&withDetails=true',
        {
            'headers': {
                'Authorization': 'Bearer ' + accessToken
            }
        }).then(r => r.json());
    console.log(response.data);
    return response.data;

}

function doFilter(allAttendees){
    let attendees = allAttendees.filter(e => e.type === 'Registration');
    let earlyBirds = attendees.filter(e => e.amount === 1850);
    let normalPrice = attendees.filter(e => e.amount === 2500);
    let couponPrice = attendees.filter(e => e.amount === 0);
    return {
        'attendees': attendees,
        'earlyBirds': earlyBirds,
        'normalPrice': normalPrice,
        'couponPrice': couponPrice
    }
}

async function main(isPOST) {
    let accessToken = await getAccessToken();
    console.log(`token ${accessToken}`)
    let attendees = await getAllAttendees(accessToken, 1);
    let attendees2 = await getAllAttendees(accessToken, 2);
    let attendees3 = await getAllAttendees(accessToken, 3);
    let attendees4 = await getAllAttendees(accessToken, 4);
    //todo handle pagination in a nice way
    let allAttendees =  attendees.concat(attendees2).concat(attendees3).concat(attendees4);
    let helloasso = doFilter(allAttendees);
    
    if (isPOST) {
        return {
            "text": `
Attendees : *${helloasso.attendees.length}*
Early Birds: *${helloasso.earlyBirds.length}*
Normal Price: *${helloasso.normalPrice.length}*
Coupon: *${helloasso.couponPrice.length}*
`,
            "username": "HelloAsso"
        };
    }
    return helloasso;
}