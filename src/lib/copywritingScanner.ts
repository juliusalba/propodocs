export interface Issue {
    text: string;
    type: 'passive' | 'weak' | 'complex' | 'cliché' | 'long-sentence';
    suggestion: string;
    index: number;
    length: number;
}

const PASSIVE_VOICE_REGEX = /\b(am|are|is|was|were|be|been|being)\b\s+(\w+ed|done|seen|written|eaten|taken|gone|paid|made|built|sent)\b/gi;
const WEAK_WORDS = ['very', 'really', 'things', 'stuff', 'just', 'literally', 'virtually', 'basically', 'quite', 'rather', 'somewhat', 'perhaps', 'maybe'];
const CLICHES = ['cutting edge', 'thinking outside the box', 'game changer', 'move the needle', 'paradigm shift', 'synergy', 'leverage', 'best of breed', 'core competency', 'deep dive', 'drill down', 'ecosystem', 'low hanging fruit', 'mission critical'];

export function scanText(text: string): Issue[] {
    const issues: Issue[] = [];

    // Passive Voice
    let match;
    // Reset lastIndex if reusing regex, but here we create new regex or use exec in loop
    // For global regex literal, lastIndex is stateful
    PASSIVE_VOICE_REGEX.lastIndex = 0;
    while ((match = PASSIVE_VOICE_REGEX.exec(text)) !== null) {
        issues.push({
            text: match[0],
            type: 'passive',
            suggestion: 'Use active voice for more impact',
            index: match.index,
            length: match[0].length
        });
    }

    // Weak Words
    WEAK_WORDS.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        while ((match = regex.exec(text)) !== null) {
            issues.push({
                text: match[0],
                type: 'weak',
                suggestion: 'Remove or replace with a stronger alternative',
                index: match.index,
                length: match[0].length
            });
        }
    });

    // Cliches
    CLICHES.forEach(cliche => {
        const regex = new RegExp(`\\b${cliche}\\b`, 'gi');
        while ((match = regex.exec(text)) !== null) {
            issues.push({
                text: match[0],
                type: 'cliché',
                suggestion: 'Avoid jargon, be specific',
                index: match.index,
                length: match[0].length
            });
        }
    });

    // Long Sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    let currentIndex = 0;
    sentences.forEach(sentence => {
        if (sentence.split(/\s+/).length > 25) {
            const trimmed = sentence.trim();
            issues.push({
                text: trimmed,
                type: 'long-sentence',
                suggestion: 'Consider splitting this long sentence (>25 words)',
                index: text.indexOf(trimmed, currentIndex), // Approximate, good enough for demo
                length: trimmed.length
            });
        }
        currentIndex += sentence.length;
    });

    return issues.sort((a, b) => a.index - b.index);
}