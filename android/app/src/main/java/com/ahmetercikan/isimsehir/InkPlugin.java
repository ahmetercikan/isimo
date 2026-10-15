package com.ahmetercikan.isimsehir;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.common.MlKitException;
import com.google.mlkit.common.model.DownloadConditions;
import com.google.mlkit.common.model.RemoteModelManager;
import com.google.mlkit.vision.digitalink.common.RecognitionCandidate;
import com.google.mlkit.vision.digitalink.recognition.DigitalInkRecognition;
import com.google.mlkit.vision.digitalink.recognition.DigitalInkRecognitionModel;
import com.google.mlkit.vision.digitalink.recognition.DigitalInkRecognitionModelIdentifier;
import com.google.mlkit.vision.digitalink.recognition.DigitalInkRecognizer;
import com.google.mlkit.vision.digitalink.recognition.DigitalInkRecognizerOptions;
import com.google.mlkit.vision.digitalink.recognition.Ink;
import com.google.mlkit.vision.digitalink.recognition.RecognitionContext;
import com.google.mlkit.vision.digitalink.recognition.WritingArea;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * El yazısı tanıma (Google ML Kit Digital Ink). Web tarafı: src/lib/ink.ts.
 *   prepare({ lang })                          Türkçe modeli indirir (bir kez, ~20 MB; sonra internetsiz çalışır)
 *   recognize({ strokes, width, height, lang }) → { candidates: string[] } (en olası önce)
 * strokes: [{ x: number[], y: number[], t: number[] }]
 */
@CapacitorPlugin(name = "Ink")
public class InkPlugin extends Plugin {
    private DigitalInkRecognitionModel model;
    private DigitalInkRecognizer recognizer;
    private String modelLang;

    private DigitalInkRecognitionModel modelFor(String lang) throws MlKitException {
        if (model != null && lang.equals(modelLang)) return model;
        DigitalInkRecognitionModelIdentifier id = DigitalInkRecognitionModelIdentifier.fromLanguageTag(lang);
        if (id == null) id = DigitalInkRecognitionModelIdentifier.TR_TR;
        model = DigitalInkRecognitionModel.builder(id).build();
        modelLang = lang;
        if (recognizer != null) recognizer.close();
        recognizer = null;
        return model;
    }

    @PluginMethod
    public void prepare(PluginCall call) {
        String lang = call.getString("lang", "tr");
        final DigitalInkRecognitionModel m;
        try {
            m = modelFor(lang);
        } catch (MlKitException e) {
            call.reject("Model bulunamadı: " + lang, e);
            return;
        }
        RemoteModelManager mgr = RemoteModelManager.getInstance();
        mgr.isModelDownloaded(m)
            .addOnSuccessListener(have -> {
                if (have) {
                    ensureRecognizer(m);
                    call.resolve(ready(true));
                    return;
                }
                mgr.download(m, new DownloadConditions.Builder().build())
                    .addOnSuccessListener(v -> {
                        ensureRecognizer(m);
                        call.resolve(ready(true));
                    })
                    .addOnFailureListener(e -> call.resolve(ready(false)));
            })
            .addOnFailureListener(e -> call.resolve(ready(false)));
    }

    private JSObject ready(boolean ok) {
        JSObject r = new JSObject();
        r.put("ready", ok);
        return r;
    }

    private void ensureRecognizer(DigitalInkRecognitionModel m) {
        if (recognizer == null) {
            recognizer = DigitalInkRecognition.getClient(DigitalInkRecognizerOptions.builder(m).setMaxResultCount(6).build());
        }
    }

    @PluginMethod
    public void recognize(PluginCall call) {
        if (recognizer == null || model == null) {
            call.reject("Model hazır değil");
            return;
        }
        JSArray strokes = call.getArray("strokes");
        float width = call.getFloat("width", 320f);
        float height = call.getFloat("height", 200f);
        Ink.Builder ink = Ink.builder();
        try {
            for (int i = 0; i < strokes.length(); i++) {
                JSONObject s = strokes.getJSONObject(i);
                JSONArray xs = s.getJSONArray("x");
                JSONArray ys = s.getJSONArray("y");
                JSONArray ts = s.optJSONArray("t");
                Ink.Stroke.Builder sb = Ink.Stroke.builder();
                for (int k = 0; k < xs.length(); k++) {
                    float x = (float) xs.getDouble(k);
                    float y = (float) ys.getDouble(k);
                    if (ts != null && k < ts.length()) sb.addPoint(Ink.Point.create(x, y, ts.getLong(k)));
                    else sb.addPoint(Ink.Point.create(x, y));
                }
                ink.addStroke(sb.build());
            }
        } catch (JSONException e) {
            call.reject("Geçersiz çizgi verisi", e);
            return;
        }
        RecognitionContext ctx = RecognitionContext.builder().setPreContext("").setWritingArea(new WritingArea(width, height)).build();
        recognizer.recognize(ink.build(), ctx)
            .addOnSuccessListener(result -> {
                JSArray out = new JSArray();
                for (RecognitionCandidate c : result.getCandidates()) out.put(c.getText());
                JSObject r = new JSObject();
                r.put("candidates", out);
                call.resolve(r);
            })
            .addOnFailureListener(e -> call.reject("Tanınamadı", e));
    }

    @Override
    protected void handleOnDestroy() {
        if (recognizer != null) recognizer.close();
        recognizer = null;
    }
}
