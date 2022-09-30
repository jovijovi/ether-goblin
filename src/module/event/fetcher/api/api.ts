import {log} from '@jovijovi/pedrojs-common';
import {KEY} from '@jovijovi/pedrojs-network-http/middleware/requestid';
import {MyResponse} from '../../../../common/response';
import {fetcher} from '../index';

// FetchEvents push FetchEvents job to scheduler
export async function FetchEvents(req, res) {
	if (!req.body ||
		!req.body.eventType ||
		!req.body.toBlock
	) {
		log.RequestId(req[KEY]).error("Bad request, req=", req.body);
		return MyResponse.BadRequest(res);
	}

	try {
		log.RequestId(req[KEY]).info("FetchEvents Request=\n%o", req.body);

		fetcher.PushFetchEventsJob({
			address: req.body.address,      // The address to filter by, or null to match any address (Optional)
			eventType: req.body.eventType,  // ERC721 event type: mint/transfer/burn ("mint" by default)
			fromBlock: req.body.fromBlock,  // Fetch from block number (Optional, 0 by default)
			toBlock: req.body.toBlock,      // Fetch to block number
			maxBlockRange: req.body.maxBlockRange,          // eth_getLogs block range (Optional)
			pushJobIntervals: req.body.pushJobIntervals,    // Push job intervals (unit: ms) (Optional)
		});
		res.send(MyResponse.OK());

		log.RequestId(req[KEY]).info("FetchEvents job scheduled, request=\n%o", req.body);
	} catch (e) {
		return MyResponse.Error(res, e);
	}

	return;
}