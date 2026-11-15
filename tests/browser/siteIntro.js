export async function skipSiteIntro(page) {
  const skip = page.getByRole('button', { name: 'Omitir intro' });
  const play = page.getByRole('button', { name: 'Jugar', exact: true });
  await skip.or(play).waitFor({ state: 'visible' });
  if (await skip.isVisible()) await skip.click();
}

