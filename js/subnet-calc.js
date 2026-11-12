/**
 * NetLearn - Subnetting & CIDR Calculation Engine
 * High-precision IPv4 math, bitwise operations, binary formatting, and VLSM allocation.
 */

const SubnetEngine = {
  // Convert IP string (e.g. "192.168.1.1") to 32-bit unsigned integer
  ipToInt(ipStr) {
    const octets = ipStr.trim().split('.').map(Number);
    if (octets.length !== 4 || octets.some(o => isNaN(o) || o < 0 || o > 255)) {
      return null;
    }
    return ((octets[0] << 24) >>> 0) + (octets[1] << 16) + (octets[2] << 8) + octets[3];
  },

  // Convert 32-bit unsigned integer back to dotted-decimal string
  intToIp(intVal) {
    return [
      (intVal >>> 24) & 255,
      (intVal >>> 16) & 255,
      (intVal >>> 8) & 255,
      intVal & 255
    ].join('.');
  },

  // Convert 32-bit integer to 8-bit octets array of binary strings
  intToBinaryOctets(intVal) {
    const octets = [
      (intVal >>> 24) & 255,
      (intVal >>> 16) & 255,
      (intVal >>> 8) & 255,
      intVal & 255
    ];
    return octets.map(o => o.toString(2).padStart(8, '0'));
  },

  // Generate 32-bit mask integer from prefix (0-32)
  prefixToMaskInt(prefix) {
    if (prefix === 0) return 0;
    return ((0xFFFFFFFF << (32 - prefix)) >>> 0);
  },

  // Convert mask string (e.g. "255.255.255.192") to prefix number
  maskToPrefix(maskStr) {
    const maskInt = this.ipToInt(maskStr);
    if (maskInt === null) return null;
    let prefix = 0;
    for (let i = 31; i >= 0; i--) {
      if ((maskInt >>> i) & 1) {
        prefix++;
      } else {
        // All subsequent bits must be 0
        const remainder = maskInt & ((1 << i) - 1);
        if (remainder !== 0) return null; // Invalid mask
        break;
      }
    }
    return prefix;
  },

  // Identify IPv4 class
  getIpClass(firstOctet) {
    if (firstOctet >= 1 && firstOctet <= 126) return 'A';
    if (firstOctet === 127) return 'Loopback';
    if (firstOctet >= 128 && firstOctet <= 191) return 'B';
    if (firstOctet >= 192 && firstOctet <= 223) return 'C';
    if (firstOctet >= 224 && firstOctet <= 239) return 'D (Multicast)';
    return 'E (Eksperimental)';
  },

  // Identify IP scope
  getIpScope(ipStr) {
    const intVal = this.ipToInt(ipStr);
    if (intVal === null) return 'Unknown';
    const o1 = (intVal >>> 24) & 255;
    const o2 = (intVal >>> 16) & 255;

    if (o1 === 10) return 'Private (RFC 1918 Kelas A)';
    if (o1 === 172 && o2 >= 16 && o2 <= 31) return 'Private (RFC 1918 Kelas B)';
    if (o1 === 192 && o2 === 168) return 'Private (RFC 1918 Kelas C)';
    if (o1 === 127) return 'Localhost / Loopback';
    if (o1 === 169 && o2 === 254) return 'APIPA (Auto IP)';
    if (o1 >= 224 && o1 <= 239) return 'Multicast';
    return 'Public Internet';
  },

  // Core calculation function
  calculate(ipInput, prefixOrMask) {
    const cleanIp = ipInput.trim();
    const ipInt = this.ipToInt(cleanIp);
    if (ipInt === null) {
      return { success: false, error: 'Format IP Address tidak valid! Contoh: 192.168.10.1' };
    }

    let prefix;
    if (typeof prefixOrMask === 'number') {
      prefix = prefixOrMask;
    } else if (String(prefixOrMask).startsWith('/')) {
      prefix = parseInt(prefixOrMask.slice(1), 10);
    } else if (prefixOrMask.includes('.')) {
      prefix = this.maskToPrefix(prefixOrMask);
      if (prefix === null) {
        return { success: false, error: 'Format Subnet Mask tidak valid! Contoh: 255.255.255.192' };
      }
    } else {
      prefix = parseInt(prefixOrMask, 10);
    }

    if (isNaN(prefix) || prefix < 1 || prefix > 32) {
      return { success: false, error: 'Prefix harus berada di antara /1 hingga /32' };
    }

    const maskInt = this.prefixToMaskInt(prefix);
    const wildcardInt = (~maskInt) >>> 0;
    const networkInt = (ipInt & maskInt) >>> 0;
    const broadcastInt = (networkInt | wildcardInt) >>> 0;

    const totalHosts = Math.pow(2, 32 - prefix);
    let usableHosts = 0;
    let firstHostInt = 0;
    let lastHostInt = 0;

    if (prefix === 31) {
      usableHosts = 2; // RFC 3021 Point-to-Point
      firstHostInt = networkInt;
      lastHostInt = broadcastInt;
    } else if (prefix === 32) {
      usableHosts = 1;
      firstHostInt = networkInt;
      lastHostInt = networkInt;
    } else {
      usableHosts = totalHosts - 2;
      firstHostInt = networkInt + 1;
      lastHostInt = broadcastInt - 1;
    }

    const firstOctet = (ipInt >>> 24) & 255;
    const ipClass = this.getIpClass(firstOctet);
    const ipScope = this.getIpScope(cleanIp);

    // Generate Subnet Table for this block (up to 16 subnets for visual clarity)
    const subnetsList = [];
    const parentClassPrefix = ipClass === 'A' ? 8 : (ipClass === 'B' ? 16 : 24);
    const baseBlockPrefix = Math.min(parentClassPrefix, prefix);
    const baseMaskInt = this.prefixToMaskInt(baseBlockPrefix);
    const baseNetworkInt = (ipInt & baseMaskInt) >>> 0;
    const subnetsCount = Math.pow(2, Math.max(0, prefix - baseBlockPrefix));
    const renderLimit = Math.min(subnetsCount, 16);

    for (let i = 0; i < renderLimit; i++) {
      const subNetInt = (baseNetworkInt + (i * totalHosts)) >>> 0;
      const subBcastInt = (subNetInt + totalHosts - 1) >>> 0;
      subnetsList.push({
        index: i + 1,
        network: this.intToIp(subNetInt),
        firstHost: prefix >= 31 ? this.intToIp(subNetInt) : this.intToIp(subNetInt + 1),
        lastHost: prefix >= 31 ? this.intToIp(subBcastInt) : this.intToIp(subBcastInt - 1),
        broadcast: this.intToIp(subBcastInt),
        isCurrent: (networkInt === subNetInt)
      });
    }

    const defaultClassPrefix = ipClass === 'A' ? 8 : (ipClass === 'B' ? 16 : (ipClass === 'C' ? 24 : prefix));
    const borrowedBits = Math.max(0, prefix - defaultClassPrefix);
    const hostBits = 32 - prefix;

    // Calculate block interval on the interesting octet
    let criticalOctetIndex = 4;
    let maskOctetVal = maskInt & 255;
    if (prefix < 16) {
      criticalOctetIndex = 2;
      maskOctetVal = (maskInt >>> 16) & 255;
    } else if (prefix < 24) {
      criticalOctetIndex = 3;
      maskOctetVal = (maskInt >>> 8) & 255;
    }
    const blockInterval = 256 - maskOctetVal;

    // IP placement on subnet ruler (0% = Network ID, 100% = Broadcast ID)
    const span = Math.max(1, broadcastInt - networkInt);
    const inputIpPercent = Math.min(100, Math.max(0, Math.round(((ipInt - networkInt) / span) * 100)));
    const isNetworkAddress = (ipInt === networkInt);
    const isBroadcastAddress = (ipInt === broadcastInt);
    const isUsableHost = (ipInt >= firstHostInt && ipInt <= lastHostInt);

    return {
      success: true,
      inputIp: cleanIp,
      prefix: prefix,
      ipClass: ipClass,
      ipScope: ipScope,
      defaultClassPrefix: defaultClassPrefix,
      borrowedBits: borrowedBits,
      hostBits: hostBits,
      blockInterval: blockInterval,
      criticalOctetIndex: criticalOctetIndex,
      netmask: this.intToIp(maskInt),
      wildcard: this.intToIp(wildcardInt),
      networkAddress: this.intToIp(networkInt),
      broadcastAddress: this.intToIp(broadcastInt),
      firstUsableHost: this.intToIp(firstHostInt),
      lastUsableHost: this.intToIp(lastHostInt),
      totalHosts: totalHosts,
      usableHosts: usableHosts,
      inputIpPercent: inputIpPercent,
      isNetworkAddress: isNetworkAddress,
      isBroadcastAddress: isBroadcastAddress,
      isUsableHost: isUsableHost,
      // Binary representations
      ipBinary: this.intToBinaryOctets(ipInt),
      maskBinary: this.intToBinaryOctets(maskInt),
      networkBinary: this.intToBinaryOctets(networkInt),
      broadcastBinary: this.intToBinaryOctets(broadcastInt),
      subnetsList: subnetsList,
      totalSubnetsInBlock: subnetsCount
    };

    if (typeof NetLearnStore !== 'undefined' && NetLearnStore.state) {
      NetLearnStore.state.simulasiCalcCount = (NetLearnStore.state.simulasiCalcCount || 0) + 1;
      NetLearnStore.save();
    }

    return res;
  },

  // VLSM Allocation Planner
  calculateVLSM(majorNetworkStr, segments) {
    // segments: [ { name: "Lab TKJ", hosts: 55 }, { name: "Lab RPL", hosts: 28 }, ... ]
    const parts = majorNetworkStr.trim().split('/');
    if (parts.length !== 2) {
      return { success: false, error: 'Format Major Network harus menggunakan CIDR, contoh: 192.168.1.0/24' };
    }

    const majorIp = parts[0].trim();
    const majorPrefix = parseInt(parts[1], 10);
    const majorIpInt = this.ipToInt(majorIp);

    if (majorIpInt === null || isNaN(majorPrefix) || majorPrefix < 8 || majorPrefix > 30) {
      return { success: false, error: 'Alamat Major Network atau Prefix tidak valid!' };
    }

    // Sort segments descending by host requirement (Golden rule of VLSM!)
    const sortedSegments = [...segments].sort((a, b) => ((b.hosts || b.neededHosts || 0) - (a.hosts || a.neededHosts || 0)));

    let currentIpInt = majorIpInt;
    const allocatedSubnets = [];
    const maxCapacityInt = majorIpInt + Math.pow(2, 32 - majorPrefix);

    for (const seg of sortedSegments) {
      const neededHosts = parseInt(seg.hosts || seg.neededHosts, 10);
      if (isNaN(neededHosts) || neededHosts <= 0) continue;

      // Find required host bits: 2^h - 2 >= neededHosts
      let h = 2;
      while ((Math.pow(2, h) - 2) < neededHosts) {
        h++;
      }
      const segPrefix = 32 - h;
      const blockSize = Math.pow(2, h);

      // Check boundary alignment
      if (currentIpInt % blockSize !== 0) {
        currentIpInt = Math.ceil(currentIpInt / blockSize) * blockSize;
      }

      const netInt = currentIpInt;
      const bcastInt = netInt + blockSize - 1;

      if (bcastInt >= maxCapacityInt) {
        return {
          success: false,
          error: `Ruang alamat IP pada ${majorNetworkStr} tidak mencukupi untuk mengalokasikan segmen '${seg.name}' (${neededHosts} host)!`
        };
      }

      const maskInt = this.prefixToMaskInt(segPrefix);

      allocatedSubnets.push({
        name: seg.name,
        neededHosts: neededHosts,
        allocatedHosts: blockSize - 2,
        totalSize: blockSize,
        prefix: `/${segPrefix}`,
        subnetMask: this.intToIp(maskInt),
        networkAddress: this.intToIp(netInt),
        usableRange: `${this.intToIp(netInt + 1)} - ${this.intToIp(bcastInt - 1)}`,
        broadcastAddress: this.intToIp(bcastInt)
      });

      currentIpInt = bcastInt + 1;
    }

    const remainingIps = maxCapacityInt - currentIpInt;

    return {
      success: true,
      majorNetwork: majorNetworkStr,
      subnets: allocatedSubnets,
      remainingIps: remainingIps,
      nextFreeIp: remainingIps > 0 ? this.intToIp(currentIpInt) : 'Penuh'
    };
  }
};

window.SubnetEngine = SubnetEngine;

