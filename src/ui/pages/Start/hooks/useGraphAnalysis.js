import {useCallback, useState} from "react";
import Graph from "../../../../entities/graph/Graph";
import SvgHandler from "../../../../business-logic/handlers/SvgHandler";
import SelectionHandler from "../../../../business-logic/handlers/SelectionHandler";
import {validateGraph} from "../../../../business-logic/services/graphValidation";
import config from "../../../../client_config.json";

const profiles = config.profiles;

export default function useGraphAnalysis(formatMessage, msgs) {
    const [analyze, setAnalyze] = useState({
        status: false,
        keys: Object.keys(profiles),
        data: profiles.default,
    });

    const analyzeGraph = useCallback(() => {
        SelectionHandler.instance.clear();

        const data = validateGraph(
            Graph.instance,
            SvgHandler.instance,
            formatMessage,
            msgs
        );

        // Errors block further processing
        if (!data.valid) {
            if (data.errors.length > 0) window.alert(data.errors.join("\n"));
            return;
        }

        // Show warnings if any
        if (data.warnings.length > 0)
            window.alert(data.warnings.join("\n"));

        const crit = Graph.instance.analyze(data, analyze.data);
        const segCount = Array.from(crit.critSeg).length;

        if (crit.critNodes.length === 0 && segCount === 0) {
            window.alert(formatMessage(msgs.export));
            return;
        }

        setAnalyze({status: true, keys: analyze.keys, data: profiles.default});

        const svgh = SvgHandler.instance;
        svgh.setCritNodes(crit.critNodes);
        svgh.setCritSeg(crit.critSeg);

        window.alert(formatMessage(msgs.useful));
    }, [analyze.data, analyze.keys, formatMessage, msgs]);

    return {analyze, analyzeGraph, setAnalyze};
}