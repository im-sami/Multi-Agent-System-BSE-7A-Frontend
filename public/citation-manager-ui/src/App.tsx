import React from 'react';
import { CitationForm } from './components/CitationForm';
import { SavedCitationsList } from './components/SavedCitationsList';
import { PDFReferenceForm } from './components/PDFReferenceForm';
import { BibliographyForm } from './components/BibliographyForm';

function App() {
  return (
    <div className="App cm-container">
      <h1 className="cm-title">Citation Manager</h1>
      <p className="cm-subtitle">Generate, validate, and format citations (APA, MLA, Chicago, Harvard, IEEE).</p>
      <CitationForm />
      <PDFReferenceForm />
      <BibliographyForm />
      <SavedCitationsList />
    </div>
  );
}

export default App;
