import path from 'path'
import fs from 'fs'
import { HttpRequest, HttpResponse } from 'uWebSockets.js'
import detectStaticExtension from '../../utils/DetectStaticExtension.uws'
import { ENV } from '../../constants'

const DetectStaticMiddle = (res: HttpResponse, req: HttpRequest): Boolean => {
	const isStatic = detectStaticExtension(req)
	/**
	 * NOTE
	 * Cache-Control max-age is 1 year
	 * calc by using:
	 * https://www.inchcalculator.com/convert/month-to-second/
	 */

	if (isStatic) {
		const filePath = path.resolve(__dirname, `../../../../dist/${req.getUrl()}`)

		if (ENV !== 'development') {
			res.writeHeader('Cache-Control', 'public, max-age=31556952')
		}

		try {
			const body = fs.readFileSync(filePath)
			res.end(body)
			// req.setYield(true)
		} catch {
			res.writeStatus('404')
			res.end('File not found')
		}
	}

	return isStatic
}

export default DetectStaticMiddle
