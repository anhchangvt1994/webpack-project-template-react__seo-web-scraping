'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _path = require('path')
var _path2 = _interopRequireDefault(_path)
var _fs = require('fs')
var _fs2 = _interopRequireDefault(_fs)

var _DetectStaticExtensionuws = require('../../utils/DetectStaticExtension.uws')
var _DetectStaticExtensionuws2 = _interopRequireDefault(
	_DetectStaticExtensionuws
)
var _constants = require('../../constants')

const DetectStaticMiddle = (res, req) => {
	const isStatic = _DetectStaticExtensionuws2.default.call(void 0, req)
	/**
	 * NOTE
	 * Cache-Control max-age is 1 year
	 * calc by using:
	 * https://www.inchcalculator.com/convert/month-to-second/
	 */

	if (isStatic) {
		const filePath = _path2.default.resolve(
			__dirname,
			`../../../../dist/${req.getUrl()}`
		)

		if (_constants.ENV !== 'development') {
			res.writeHeader('Cache-Control', 'public, max-age=31556952')
		}

		try {
			const body = _fs2.default.readFileSync(filePath)
			res.end(body)
			// req.setYield(true)
		} catch (e) {
			res.writeStatus('404')
			res.end('File not found')
		}
	}

	return isStatic
}

exports.default = DetectStaticMiddle
