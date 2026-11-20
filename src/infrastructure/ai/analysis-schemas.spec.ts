import type { Schema } from '@google/genai';
import { ANALYSIS_JSON_SCHEMA } from './analysis-json-schema';
import { ANALYSIS_RESPONSE_SCHEMA } from './gemini-prompt';

// El contrato de salida está escrito dos veces (Gemini usa su propio formato de esquema): esta
// prueba falla si las dos versiones dejan de pedir lo mismo.

type JsonNode = {
  properties?: Record<string, JsonNode>;
  items?: JsonNode;
  enum?: readonly string[];
};

const keysOf = (node: { properties?: object } | undefined) =>
  Object.keys(node?.properties ?? {}).sort();

const enumsOf = (node: {
  properties?: Record<string, { enum?: readonly string[] }>;
}) =>
  Object.fromEntries(
    Object.entries(node.properties ?? {})
      .filter(([, value]) => value.enum)
      .map(([key, value]) => [key, [...(value.enum ?? [])].sort()]),
  );

describe('analysis output schemas (Gemini and Claude)', () => {
  const gemini = ANALYSIS_RESPONSE_SCHEMA;
  const claude = ANALYSIS_JSON_SCHEMA as unknown as JsonNode;
  const geminiProfile = gemini.properties!.perfiles.items as Schema;
  const claudeProfile = claude.properties!.perfiles.items!;
  const geminiSkill = geminiProfile.properties!.habilidades.items as Schema;
  const claudeSkill = claudeProfile.properties!.habilidades.items!;

  it('ask for the same fields at every level', () => {
    expect(keysOf(gemini)).toEqual(keysOf(claude));
    expect(keysOf(geminiProfile)).toEqual(keysOf(claudeProfile));
    expect(keysOf(geminiSkill)).toEqual(keysOf(claudeSkill));
  });

  it('allow the same values for priorities, types and levels', () => {
    expect(enumsOf(geminiProfile as never)).toEqual(enumsOf(claudeProfile));
    expect(enumsOf(geminiSkill as never)).toEqual(enumsOf(claudeSkill));
  });

  it('require the same fields, except the hours Claude must list as nullable', () => {
    const claudeRequired = (
      ANALYSIS_JSON_SCHEMA.properties.perfiles.items
        .required as readonly string[]
    ).filter((key) => key !== 'horasSemanaSugeridas');
    expect([...(geminiProfile.required ?? [])].sort()).toEqual(
      [...claudeRequired].sort(),
    );
  });
});
