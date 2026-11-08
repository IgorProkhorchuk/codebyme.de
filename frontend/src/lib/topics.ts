export const topics = [
	{ slug: 'linux-shell', title: 'Linux & Shell', description: 'Bash, cgroups, system tools', tags: ['linux', 'shell', 'security', 'systemd'] },
	{ slug: 'text-processing', title: 'Text Processing', description: 'AWK, grep, sed, ripgrep', tags: ['awk', 'grep', 'sed', 'ripgrep', 'text-processing'] },
	{ slug: 'networking', title: 'Networking', description: 'IPv4, subnetting, NAT', tags: ['networking', 'ipv4', 'ipv6', 'nat'] },
	{ slug: 'containers', title: 'Containers', description: 'Docker, Podman, Distrobox', tags: ['containers', 'docker', 'podman', 'distrobox'] },
	{ slug: 'java-jvm', title: 'Java & JVM', description: 'JVM tools, Java, Kotlin', tags: ['java', 'jvm', 'kotlin'] },
	{ slug: 'git', title: 'Git', description: 'History, branches, remotes', tags: ['git'] }
];

export function matchesTopic(tags: string[], topic: (typeof topics)[number]) {
	return tags.some(tag => topic.tags.includes(tag.toLowerCase()));
}
