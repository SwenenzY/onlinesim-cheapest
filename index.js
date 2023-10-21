import got from 'got';
import pino from 'pino';
import pretty from 'pino-pretty';
import fs from 'fs';

const logger = pino( pretty( {
    translateTime: 'SYS:HH:MM:ss',
    ignore: 'hostname,pid'
} ) )


class Onlinesim {
    constructor () {
        this.countries = {};

    }

    async findService ( country = 856, service = 'battle' ) {
        let config = {
            method: 'get',
            url: `https://onlinesim.io/api/getTariffs.php?country=${ country }&filter_country=${ country }&filter_service=${ service }&lang=en`,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/118.0',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Referer': 'https://onlinesim.io/v2/numbers',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin'
            }
        };
        let response = await got( config );
        let parsedResponse = JSON.parse( response.body );
        this.countries = parsedResponse.countries;
        return parsedResponse.services;
    }

    async loopServices () {
        let priceList = [];

        for ( let country in this.countries ) {
            country = this.countries[ country ];
            logger.info( `Getting price for ${ country.name }` );
            let services = await this.findService( country.code );
            let service = services[ Object.keys( services )[ 0 ] ];

            priceList.push( {
                country: country.name,
                countryCode: country.code,
                id: service.id,
                count: service.count,
                price: service.price,
                service: service.service,
            } );
        }

        priceList.sort( ( a, b ) => a.price - b.price );
        fs.writeFileSync( 'priceList.json', JSON.stringify( priceList, null, 4 ) );
        return priceList;
    }
}

( async () => {
    let onlinesim = new Onlinesim();
    await onlinesim.findService();
    let priceList = await onlinesim.loopServices();

    logger.warn( 'Done' );
} )();