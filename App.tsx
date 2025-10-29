
import React, { useState, useCallback } from 'react';
import { analyzeComfyUIError } from './services/geminiService';
import type { Analysis } from './types';
import { DetectiveIcon, LoaderIcon, ErrorIcon, SparklesIcon, BugIcon, WrenchIcon } from './components/Icons';

const initialLog = `got prompt
D:\\ComfyUI_windows_portable\\python_embeded\\Lib\\site-packages\\torch\\cuda\\memory.py:365: FutureWarning: torch.cuda.reset_max_memory_allocated now calls torch.cuda.reset_peak_memory_stats, which resets /all/ peak memory stats.
  warnings.warn(
end_vram - start_vram: 33554432 - 33554432 = 0
#53 [SeedVR2BlockSwap]: 0.00s - vram 0b
🚀 Preparing model: seedvr2_ema_3b-Q4_K_M.gguf
💾 Cache miss: Creating new runner for model seedvr2_ema_3b-Q4_K_M.gguf
🚀 Creating DiT model on CPU for BlockSwap (will swap blocks to GPU during inference)
!!! Exception during processing !!! 'custom_nodes.ComfyUI-SeedVR2_VideoUpscaler.src'
Traceback (most recent call last):
  File "D:\\ComfyUI_windows_portable\\ComfyUI\\execution.py", line 496, in execute
    output_data, output_ui, has_subgraph, has_pending_tasks = await get_output_data(prompt_id, unique_id, obj, input_data_all, execution_block_cb=execution_block_cb, pre_execute_cb=pre_execute_cb, hidden_inputs=hidden_inputs)
  File "D:\\ComfyUI_windows_portable\\ComfyUI\\custom_nodes\\ComfyUI-SeedVR2_VideoUpscaler\\src\\interfaces\\comfyui_node.py", line 157, in execute
    return self._internal_execute(images, model, seed, new_resolution, cfg_scale,
KeyError: 'custom_nodes.ComfyUI-SeedVR2_VideoUpscaler.src'
Prompt executed in 1.27 seconds`;

const AnalysisResult: React.FC<{ analysis: Analysis }> = ({ analysis }) => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-cyan-400 mb-3 flex items-center gap-3">
          <BugIcon />
          根本原因分析
        </h2>
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-2">{analysis.rootCause.title}</h3>
          <p className="text-gray-300 whitespace-pre-wrap">{analysis.rootCause.explanation}</p>
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-cyan-400 mb-3 flex items-center gap-3">
          <WrenchIcon />
          建议的解决方案
        </h2>
        <div className="space-y-6">
          {analysis.solutions.map((solution, index) => (
            <div key={index} className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">{solution.title}</h3>
              <ol className="list-decimal list-inside space-y-3 text-gray-300">
                {solution.steps.map((step, stepIndex) => (
                  <li key={stepIndex} dangerouslySetInnerHTML={{ __html: step.replace(/`([^`]+)`/g, '<code class="bg-gray-700 text-cyan-300 px-1.5 py-0.5 rounded-md text-sm font-mono">$1</code>') }}></li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </div>
);

const App: React.FC = () => {
    const [log, setLog] = useState<string>(initialLog);
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = useCallback(async () => {
        if (!log.trim()) {
            setError("日志内容不能为空。");
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const result = await analyzeComfyUIError(log);
            setAnalysis(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "发生未知错误。");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [log]);
    
    const handleClear = useCallback(() => {
        setLog('');
        setAnalysis(null);
        setError(null);
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 p-4 sm:p-6 lg:p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8">
                    <div className="flex items-center justify-center gap-4 mb-2">
                        <DetectiveIcon />
                        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                            ComfyUI 错误侦探
                        </h1>
                    </div>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        请在下方粘贴您的 ComfyUI 错误日志。我们由 Gemini 驱动的 AI 将对其进行分析，找出根本原因，并为您提供清晰、分步的解决方案。
                    </p>
                </header>

                <main className="grid lg:grid-cols-2 gap-8">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-semibold mb-2 text-cyan-300">您的错误日志</h2>
                        <textarea
                            value={log}
                            onChange={(e) => setLog(e.target.value)}
                            placeholder="在此处粘贴完整的 ComfyUI 错误日志..."
                            className="flex-grow w-full bg-gray-950 border border-gray-700 rounded-lg p-4 font-mono text-sm text-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 min-h-[400px] lg:min-h-0"
                        />
                        <div className="mt-4 flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleAnalyze}
                                disabled={isLoading || !log.trim()}
                                className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500"
                            >
                                {isLoading ? <><LoaderIcon /> '分析中...'</> : '分析日志'}
                            </button>
                             <button
                                onClick={handleClear}
                                disabled={isLoading}
                                className="flex-1 sm:flex-initial bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500"
                            >
                                清除
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-950/50 border border-gray-800 rounded-lg p-6 relative min-h-[400px] lg:min-h-0">
                         <h2 className="text-xl font-semibold mb-4 text-cyan-300">分析报告</h2>
                        {isLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/50 rounded-lg">
                                <LoaderIcon />
                                <p className="mt-4 text-lg">Gemini 正在检查证据...</p>
                            </div>
                        )}
                        {error && (
                            <div className="flex flex-col items-center justify-center text-center text-red-400 h-full">
                                <ErrorIcon />
                                <p className="mt-4 font-semibold">分析失败</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}
                        {!isLoading && !error && !analysis && (
                             <div className="flex flex-col items-center justify-center text-center text-gray-500 h-full">
                                <SparklesIcon />
                                <p className="mt-4 text-lg">您的诊断报告将显示在此处。</p>
                                <p>点击“分析日志”开始。</p>
                            </div>
                        )}
                        {analysis && <AnalysisResult analysis={analysis} />}
                    </div>
                </main>
                 <footer className="text-center mt-12 text-gray-500 text-sm">
                    <p>由 Google Gemini API 强力驱动。分析结果可能并非总是完美。</p>
                </footer>
            </div>
        </div>
    );
};

export default App;
