async function start() {
  importScripts("./wasm_exec.js");
  const go = new self.Go();
  const response = await fetch("./birdie.wasm");
  if (!response.ok) throw new Error("Could not load the Birdie interpreter.");
  const { instance } = await WebAssembly.instantiateStreaming(
    response,
    go.importObject,
  );

  const stopped = () => {
    self.postMessage({ error: "The Birdie interpreter stopped. Try running again." });
    self.close();
  };
  void go.run(instance).then(stopped, stopped);
  if (typeof self.runBirdie !== "function") throw new Error("Could not start the Birdie interpreter.");
  self.postMessage({ ready: true });
}

const ready = start().then(() => true, (error) => {
  self.postMessage({ error: String(error) });
  self.close();
  return false;
});

self.onmessage = async ({ data: source }) => {
  try {
    if (!await ready) return;
    const result = JSON.parse(self.runBirdie(source));
    self.postMessage(result);
  } catch (error) {
    self.postMessage({ error: String(error) });
  }
};
