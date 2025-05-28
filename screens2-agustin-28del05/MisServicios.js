const renderItem = ({ item }) => (
  <View style={styles.card}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={styles.titulo}>{item.titulo}</Text>
      <TouchableOpacity onPress={() => editarServicio(item)}>
        <Ionicons name="create-outline" size={22} color="#FFA13C" />
      </TouchableOpacity>
    </View>
    <Text>{item.descripcion}</Text>
    <Text style={styles.estado}>Estado: {item.estado}</Text>
    <Text>Veces contratado: {item.veces_contratado || 0}</Text>
    <View style={styles.estrellas}>
      {renderEstrellas(item.calificacion_promedio || 0)}
    </View>
    <View style={styles.acciones}>
      <TouchableOpacity onPress={() => pausarServicio(item.id, item.estado)}>
        <Text style={styles.boton}>
          {item.estado === 'pausado' ? 'Reanudar' : 'Pausar'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => eliminarServicio(item.id)}>
        <Text style={[styles.boton, styles.botonEliminar]}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  </View>
);
