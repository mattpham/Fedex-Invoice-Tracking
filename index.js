// For reading input file
const fs = require('fs');
// For requesting tracking information
const Promise = this.Promise || require('promise');
const agent = require('superagent-promise')(require('superagent'), Promise);
// For formatting result into tabular
const columnify = require('columnify');

const fileName = process.argv[2];
if (!fileName) {
  throw new Error('Expected argument filename for .csv file.');
}

// Synchronous reading of invoice.csv and parsing into array[object{ trackingId, invoiceId }]
const invoice = fs.readFileSync(fileName, { encoding: 'UTF8' });
const shipments = invoice
  .split('\n')
  .slice(1, -1)
  .map(line => line.split(','))
  .map(line => ({
    trackingId: line[8].slice(1, -1),
    invoiceId: line[2].slice(1, -1)
  }));

// Function for generating partial tracking request info
const trackingNumberInfo = trackingNumber => ({
  trackNumberInfo: {
    trackingNumber: trackingNumber,
    trackingQualifier: '',
    trackingCarrier: ''
  }
});

// Payload for the tracking request which is a JSON object that must be URI encoded.
const payload = encodeURIComponent(
  JSON.stringify({
    TrackPackagesRequest: {
      appType: 'WTRK',
      appDeviceType: 'DESKTOP',
      uniqueKey: '',
      processingParameters: {},
      trackingInfoList: shipments.map(shipment =>
        trackingNumberInfo(shipment.trackingId)
      )
    }
  })
);

agent('POST', 'www.fedex.com/trackingCal/track')
  // .set({
  //   'User-Agent':
  //     'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:59.0) Gecko/20100101 Firefox/59.0'
  // })
  .type('form')
  .send(`data=${payload}`)
  .send('action=trackpackages')
  .send('locale=en_US')
  .send('version=1')
  .send('format=json')
  .end()
  .then(res => JSON.parse(res.text).TrackPackagesResponse)
  .then(trackPackagesResponse => {
    if (!trackPackagesResponse.successful) {
      throw new Error('TrackPackagesResponse not Successful.');
    }
    return trackPackagesResponse.packageList;
  })
  .then(packageList =>
    /**
     *  Reference `sample_response.json` for valid fields returned in the response.
     */
    packageList.map(package => ({
      invoiceId: shipments.find(
        shipment => shipment.trackingId === package.trackingNbr
      ).invoiceId,
      trackingNumber: package.trackingNbr,
      keyStatus: package.keyStatus,
      shipDate: package.displayShipDt,
      // estDeliveryDateTime: package.displayEstDeliveryDateTime,
      actDeliveryDateTime: package.displayActDeliveryDateTime,
      stdTransitDate: package.standardTransitDate.displayStdTransitDate,
      late:
        new Date(package.displayActDeliveryDt) >
        new Date(package.standardTransitDate.displayStdTransitDate)
    }))
  )
  .then(transformedList => {
    let columns = columnify(transformedList, {
      columnSplitter: ' | ',
      config: {
        value: {
          align: 'center'
        }
      }
    });
    console.log(columns);
  })
  .catch(err => console.log(err.message));
