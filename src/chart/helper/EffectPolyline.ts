/*
* Licensed to the Apache Software Foundation (ASF) under one
* or more contributor license agreements.  See the NOTICE file
* distributed with this work for additional information
* regarding copyright ownership.  The ASF licenses this file
* to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance
* with the License.  You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied.  See the License for the
* specific language governing permissions and limitations
* under the License.
*/

import Polyline from './Polyline';
import EffectLine, {ECSymbolOnEffectLine} from './EffectLine';
import * as vec2 from 'zrender/src/core/vector';
import { LineDrawSeriesScope } from './LineDraw';
import List from '../../data/List';


class EffectPolyline extends EffectLine {
    private _lastFrame = 0
    private _lastFramePercent = 0
    private _length: number

    private _points: number[][]
    private _offsets: number[]

    // Override
    createLine(lineData: List, idx: number, seriesScope: LineDrawSeriesScope) {
        return new Polyline(lineData, idx, seriesScope);
    };

    // Override
    protected updateAnimationPoints(symbol: ECSymbolOnEffectLine, points: number[][]) {
        this._points = points;
        var accLenArr = [0];
        var len = 0;
        for (var i = 1; i < points.length; i++) {
            var p1 = points[i - 1];
            var p2 = points[i];
            len += vec2.dist(p1, p2);
            accLenArr.push(len);
        }
        if (len === 0) {
            return;
        }

        for (var i = 0; i < accLenArr.length; i++) {
            accLenArr[i] /= len;
        }
        this._offsets = accLenArr;
        this._length = len;
    };

    // Override
    getLineLength() {
        return this._length;
    };

    // Override
    updateSymbolPosition(symbol: ECSymbolOnEffectLine) {
        var t = symbol.__t;
        var points = this._points;
        var offsets = this._offsets;
        var len = points.length;

        if (!offsets) {
            // Has length 0
            return;
        }

        var lastFrame = this._lastFrame;
        var frame: number;

        if (t < this._lastFramePercent) {
            // Start from the next frame
            // PENDING start from lastFrame ?
            var start = Math.min(lastFrame + 1, len - 1);
            for (frame = start; frame >= 0; frame--) {
                if (offsets[frame] <= t) {
                    break;
                }
            }
            // PENDING really need to do this ?
            frame = Math.min(frame, len - 2);
        }
        else {
            for (frame = lastFrame; frame < len; frame++) {
                if (offsets[frame] > t) {
                    break;
                }
            }
            frame = Math.min(frame - 1, len - 2);
        }

        vec2.lerp(
            symbol.position, points[frame], points[frame + 1],
            (t - offsets[frame]) / (offsets[frame + 1] - offsets[frame])
        );

        var tx = points[frame + 1][0] - points[frame][0];
        var ty = points[frame + 1][1] - points[frame][1];
        symbol.rotation = -Math.atan2(ty, tx) - Math.PI / 2;

        this._lastFrame = frame;
        this._lastFramePercent = t;

        symbol.ignore = false;
    };

}

export default EffectPolyline;