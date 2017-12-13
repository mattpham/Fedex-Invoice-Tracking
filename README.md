# Fedex-Invoice-Tracking

Script to read Fedex invoice csv files and retrieve the tracking information for the shipments.

## Use case

Fedex offers a money back guarantee when they don't delivery your package within the standard delivery window, but must be manually request within 2 weeks. The standard delivery window date is shown when creating a shipment, but is subsequently difficult to find. One exception is that the FedEx public api provides this data in the response body.

I wrote this small script script to help me find refundable late deliveries. It processes invoices downloaded from the Fedex account in csv format, and retrieving their tracking information. Any package which has its actual delivery date after the standard transit date is potentially refundable, barring any exceptions or holds on the gurantee service wide.

## Using this script

The dependencies must first be installed with `npm` or `yarn`.

Use the script by running: 
```node index.js invoice.csv```

## Changing fields

To change displayed fields, reference the `sample_response.json` file.

## Potential issues

- Must change returned fields if using Express shipments, since they have a guranteed date and time, while ground shipments are guranteed by a specific end of business day.
- Fedex public api supports upto 30 tracking numbers in a single request, code currently just batches all of the tracking numbers into a single request.
