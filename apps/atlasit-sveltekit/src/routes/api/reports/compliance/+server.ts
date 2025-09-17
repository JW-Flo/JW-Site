export const GET = async (event: any) => {
  const { request, locals } = event;
  if (!locals?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const framework = (url.searchParams.get('framework') || 'SOC2').toUpperCase();

  const report = {
    framework,
    generatedAt: new Date().toISOString(),
    generatedBy: locals.user.email || locals.user.id,
    sections: [
      { id: 'overview', title: 'Overview', content: 'Executive summary and scope.' },
      { id: 'controls', title: 'Controls', content: 'Mapped organizational controls and status.' },
      { id: 'evidence', title: 'Evidence', content: 'Artifacts and evidence collection plan.' },
      { id: 'gaps', title: 'Gaps & Remediation', content: 'Identified gaps and recommended actions.' },
    ],
  };

  return new Response(JSON.stringify(report), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
};
