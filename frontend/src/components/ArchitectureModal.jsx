import React from 'react';
import { Server, X } from 'lucide-react';

export default function ArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-amber-700" />
            <h3 className="font-bold text-lg text-stone-900">Themis AWS Serverless Architecture & Stack</h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-800 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-stone-700 leading-relaxed">
          <p>
            Themis is built 100% on serverless AWS primitives configured via AWS SAM (<code className="font-mono bg-stone-100 px-1 py-0.5 rounded">template.yaml</code>):
          </p>

          <table className="w-full border border-stone-200 text-left rounded-lg overflow-hidden">
            <thead className="bg-stone-50 text-stone-900 font-bold border-b border-stone-200">
              <tr>
                <th className="p-2.5">AWS Service</th>
                <th className="p-2.5">Implementation Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              <tr>
                <td className="p-2.5 font-semibold text-stone-900">Amazon Textract</td>
                <td className="p-2.5">Extracts structured raw text from physical notices, seals, and summons with zero server overhead.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-stone-900">Amazon Polly (Neural)</td>
                <td className="p-2.5">Studio voice <code className="font-mono bg-stone-100 px-1 py-0.5 rounded text-amber-900">Kajal (Neural hi-IN & en-IN)</code> provides human-cadence audio narration.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-stone-900">Amazon Bedrock / Groq</td>
                <td className="p-2.5">Simplifies legal clauses into 5 citizen points, verifies statutory sections, and calculates scam probability.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-stone-900">Amazon DynamoDB</td>
                <td className="p-2.5">Single-table design (<code className="font-mono bg-stone-100 px-1 py-0.5 rounded">themis-documents</code>) with composite PK/SK and GSI1 for sub-10ms scans.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-stone-900">Amazon S3</td>
                <td className="p-2.5">Stores multi-megabyte document scans and PDFs with presigned upload URLs.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-stone-900">AWS Lambda & SAM</td>
                <td className="p-2.5">Node.js 22 serverless microservices (<code className="font-mono bg-stone-100 px-1 py-0.5 rounded">analyze</code>, <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">history</code>) scaling to zero.</td>
              </tr>
            </tbody>
          </table>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
            <span className="font-bold text-stone-900 block mb-1">LocalStack & Production Parity:</span>
            LocalStack emulates DynamoDB and S3 for completely offline testing, while Amazon Polly and Textract connect to live AWS Mumbai endpoints (<code className="font-mono bg-stone-100 px-1 py-0.5 rounded">ap-south-1</code>).
          </div>
        </div>

        <div className="border-t border-stone-200 pt-4 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            {t.closeModal}
          </button>
        </div>
      </div>
    </div>
  );
}
